# Usage: python3 scripts/render-mascot.py 1024 mascot.png 512  (needs numpy + Pillow)
"""Ray-marched 3D render of the plush monkey mascot (signed distance fields, numpy).

World units: y up, z towards the camera, feet at y=0. Orthographic camera, tilted down by PITCH.
Screen mapping (SVG viewBox 0..100): vbx = 50 + q.x, vby = Y0 - q.y where q = Rx(PITCH) p.
"""
import json
import sys
import time

import numpy as np
from PIL import Image

RES = int(sys.argv[1]) if len(sys.argv) > 1 else 512
OUT = sys.argv[2] if len(sys.argv) > 2 else 'vuddi.png'
PITCH = np.radians(7.0)
Y0 = 95.5
SCALE = 0.93
cP, sP = np.cos(PITCH), np.sin(PITCH)


def to_cam(p):
    return np.stack([p[..., 0], p[..., 1] * cP - p[..., 2] * sP, p[..., 1] * sP + p[..., 2] * cP], -1)


def to_world(q):
    return np.stack([q[..., 0], q[..., 1] * cP + q[..., 2] * sP, -q[..., 1] * sP + q[..., 2] * cP], -1)


def project(p):
    q = to_cam(np.asarray(p, float))
    return [round(50 + float(q[0]) * SCALE, 2), round(Y0 - float(q[1]) * SCALE, 2)]


# ---------------------------------------------------------------- noise
def _hash(ix, iy, iz):
    h = ix * 73856093 ^ iy * 19349663 ^ iz * 83492791
    h = (h ^ (h >> 13)) * 1274126177
    h = h ^ (h >> 16)
    return (h & 0xFFFF).astype(np.float64) / 65535.0


def vnoise(p):
    i = np.floor(p).astype(np.int64)
    f = p - i
    u = f * f * (3 - 2 * f)
    x, y, z = i[:, 0], i[:, 1], i[:, 2]
    n000 = _hash(x, y, z); n100 = _hash(x + 1, y, z); n010 = _hash(x, y + 1, z); n110 = _hash(x + 1, y + 1, z)
    n001 = _hash(x, y, z + 1); n101 = _hash(x + 1, y, z + 1); n011 = _hash(x, y + 1, z + 1); n111 = _hash(x + 1, y + 1, z + 1)
    ux, uy, uz = u[:, 0], u[:, 1], u[:, 2]
    a = n000 + (n100 - n000) * ux; b = n010 + (n110 - n010) * ux
    c = n001 + (n101 - n001) * ux; d = n011 + (n111 - n011) * ux
    e = a + (b - a) * uy; g = c + (d - c) * uy
    return e + (g - e) * uz  # 0..1


def fbm(p, octaves=3):
    s, amp, tot = 0.0, 0.5, 0.0
    q = p.copy()
    for _ in range(octaves):
        s = s + amp * vnoise(q)
        tot += amp
        q = q * 2.03 + 17.1
        amp *= 0.5
    return s / tot


# ---------------------------------------------------------------- primitives
def sd_ellipsoid(p, c, r):
    q = (p - np.asarray(c)) / np.asarray(r)
    k0 = np.linalg.norm(q, axis=-1)
    k1 = np.linalg.norm(q / np.asarray(r), axis=-1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-6)


def sd_cone(p, a, b, ra, rb):
    a = np.asarray(a); b = np.asarray(b)
    pa = p - a; ba = b - a
    h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    return np.linalg.norm(pa - h[:, None] * ba, axis=-1) - (ra + (rb - ra) * h)


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b + (a - b) * h - k * h * (1 - h)


# ---------------------------------------------------------------- the plush monkey
SNOUT = ((0, 64.0, 10.0), (14.6, 10.6, 10.4))
HEAD = ((0, 74.5, 0), (17.6, 16.4, 15.6))
FACE = ((0, 75.0, 11.0), (10.8, 8.6, 7.5))  # cream patch around the eyes (mask volume)
EARS = [((s * 19.4, 77.0, 0.5), (6.4, 6.6, 3.0)) for s in (-1, 1)]
BELLY = (0, 33.0)  # centre of the cream belly patch (x, y), radii below
BELLY_R = (11.5, 12.5)
BUTTON = ((0, 28.5, 15.0), (3.3, 3.3, 1.2))


def sd_fur_base(p):
    d = sd_ellipsoid(p, (0, 29, 0), (20.5, 18.5, 15.5))
    d = smin(d, sd_ellipsoid(p, (0, 46, -1), (14.5, 12.5, 12.0)), 7.0)
    for s in (-1, 1):
        d = smin(d, sd_ellipsoid(p, (s * 9.6, 10, 2), (8.6, 9.2, 8.2)), 3.0)
        d = smin(d, sd_ellipsoid(p, (s * 10.2, 4.2, 5.2), (7.6, 4.6, 9.6)), 2.0)
        arm = sd_cone(p, (s * 16.5, 50.0, 1.0), (s * 23.0, 26.0, 3.5), 5.4, 5.0)
        arm = smin(arm, sd_ellipsoid(p, (s * 23.2, 24.2, 3.8), (5.5, 5.6, 5.5)), 2.0)
        d = smin(d, arm, 1.0)
    head = sd_ellipsoid(p, *HEAD)
    for (cx, cy, cz, r) in ((-5.6, 89.6, 1.5, 4.4), (0, 91.2, 0.8, 4.8), (5.6, 89.6, 1.5, 4.4)):
        head = smin(head, np.linalg.norm(p - np.array([cx, cy, cz]), axis=-1) - r, 2.2)
    for c, r in EARS:
        head = smin(head, sd_ellipsoid(p, c, r), 1.6)
    d = smin(d, head, 4.0)
    return d


def sd_snout(p):
    return sd_ellipsoid(p, *SNOUT)


def sd_button(p):
    return sd_ellipsoid(p, *BUTTON)


def cream_mask(p):
    """1 where the fur surface is short cream pile (face patch, belly, inner ears)"""
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    jitter = (vnoise(p * 1.1) - 0.5) * 0.22
    face = ((x / FACE[1][0]) ** 2 + ((y - FACE[0][1]) / FACE[1][1]) ** 2) < 1 + jitter
    face &= z > 4
    belly = ((x / BELLY_R[0]) ** 2 + ((y - BELLY[1]) / BELLY_R[1]) ** 2) < 1 + jitter * 0.6
    belly &= z > 6
    ear = np.zeros_like(face)
    for c, _ in EARS:
        ear |= (((x - c[0]) / 3.9) ** 2 + ((y - c[1]) / 4.1) ** 2 < 1) & (z > c[2] + 0.4)
    return face | belly | ear


def displacement(p, near):
    """fur clumps + hanging strands; much shorter on cream areas"""
    out = np.zeros(len(p))
    if not near.any():
        return out
    q = p[near]
    clump = fbm(q * 0.38, 3) - 0.5
    strand = vnoise(q * np.array([1.25, 0.28, 1.25])) - 0.5
    amp = np.where(cream_mask(q), 0.1, 1.0)
    out[near] = amp * (clump * 0.8 + strand * 0.4)
    return out


def scene(p, detail=True):
    df = sd_fur_base(p)
    if detail:
        near = df < 2.5
        df = df - displacement(p, near)
    ds = sd_snout(p)
    db = sd_button(p)
    d = smin(df, ds, 1.0)
    d = np.minimum(d, db)
    return d, df, ds, db


# ---------------------------------------------------------------- render
def render():
    t0 = time.time()
    n = RES
    px = (np.arange(n) + 0.5) / n * 100
    vbx, vby = np.meshgrid(px, px)
    q = np.stack([(vbx.ravel() - 50) / SCALE, (Y0 - vby.ravel()) / SCALE, np.full(n * n, 60.0)], -1)
    ro = to_world(q)
    rd = to_world(np.array([[0, 0, -1.0]]))[0]

    N = n * n
    t = np.zeros(N)
    hit = np.zeros(N, bool)
    alive = np.ones(N, bool)
    min_df = np.full(N, 1e9)
    min_pos = np.zeros((N, 3))
    for it in range(160):
        idx = np.nonzero(alive)[0]
        if len(idx) == 0:
            break
        p = ro[idx] + t[idx, None] * rd
        d, df, _, _ = scene(p)
        better = df < min_df[idx]
        min_df[idx[better]] = df[better]
        min_pos[idx[better]] = p[better]
        h = d < 0.02
        hit[idx[h]] = True
        alive[idx[h]] = False
        t[idx[~h]] += np.maximum(d[~h] * 0.55, 0.02)
        far = t[idx] > 120
        alive[idx[far]] = False
    print('march', time.time() - t0, hit.sum())

    rgb = np.zeros((N, 3))
    alpha = np.zeros(N)

    # --------------------------------------------- surface shading
    hi = np.nonzero(hit)[0]
    p = ro[hi] + t[hi, None] * rd
    e = 0.35
    nrm = np.zeros_like(p)
    for k in range(3):
        o = np.zeros(3); o[k] = e
        nrm[:, k] = scene(p + o)[0] - scene(p - o)[0]
    nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True) + 1e-9

    _, df, ds, db = scene(p)
    is_button = db <= np.minimum(df, ds) + 0.05
    is_snout = (~is_button) & (ds < df + 0.15)
    cream = (~is_button) & (is_snout | cream_mask(p))

    def lin(hexc):
        c = np.array([int(hexc[i:i + 2], 16) for i in (1, 3, 5)]) / 255.0
        return c ** 2.2

    fur_dark, fur, fur_light = lin('#b9732a'), lin('#dc9a3e'), lin('#f4c47a')
    cream_c, cream_d = lin('#fbf2e0'), lin('#e9d6b2')
    btn = lin('#38b6d4')

    streak = fbm(p * np.array([0.9, 0.2, 0.9]), 3)
    tip = vnoise(p * 1.1)
    fur_alb = np.where((streak < 0.5)[:, None], fur_dark + (fur - fur_dark) * (streak / 0.5)[:, None],
                       fur + (fur_light - fur) * ((streak - 0.5) / 0.5)[:, None])
    fur_alb = fur_alb * (0.94 + 0.12 * tip)[:, None]
    cream_v = vnoise(p * 1.8)
    cream_alb = cream_d + (cream_c - cream_d) * (0.55 + 0.45 * cream_v)[:, None]
    alb = np.where(cream[:, None], cream_alb, fur_alb)
    alb = np.where(is_button[:, None], btn, alb)

    view = -rd
    L1 = np.array([-0.55, 0.75, 0.62]); L1 /= np.linalg.norm(L1)
    L2 = np.array([0.8, 0.15, 0.55]); L2 /= np.linalg.norm(L2)

    def soft_shadow(pp, L, k=7.0):
        res = np.ones(len(pp))
        tt = np.full(len(pp), 0.35)
        for _ in range(36):
            d = scene(pp + tt[:, None] * L, detail=False)[0]
            res = np.minimum(res, k * d / tt)
            tt += np.clip(d, 0.25, 4.0)
        return np.clip(res, 0, 1)

    def ao(pp, nn):
        occ = np.zeros(len(pp))
        sca = 1.0
        for i in range(1, 6):
            h = 1.3 * i
            d = scene(pp + nn * h, detail=False)[0]
            occ += (h - d) * sca
            sca *= 0.75
        return np.clip(1 - 0.06 * occ, 0, 1)

    sh = soft_shadow(p + nrm * 0.3, L1)
    occ = ao(p, nrm)
    wrap = 0.35
    dif1 = np.clip((nrm @ L1 + wrap) / (1 + wrap), 0, 1) * (0.18 + 0.82 * sh)
    dif2 = np.clip((nrm @ L2 + 0.2) / 1.2, 0, 1)
    ndv = np.clip(nrm @ view, 0, 1)
    fres = (1 - ndv) ** 2.5
    sky = 0.5 + 0.5 * nrm[:, 1]

    col = alb * (dif1[:, None] * np.array([1.05, 0.98, 0.9]) * 1.15
                 + dif2[:, None] * np.array([0.7, 0.8, 1.0]) * 0.28
                 + (sky * occ)[:, None] * np.array([0.6, 0.62, 0.7]) * 0.42)
    # velvety sheen at grazing angles (fur tips catch the light)
    sheen = np.where(cream, 0.18, 0.45) * fres * (0.5 + 0.5 * sh)
    col += (sheen[:, None] * np.where(cream[:, None], cream_c, fur_light))
    # glossy button + slight satin on the snout
    hv = L1 + view; hv /= np.linalg.norm(hv)
    spec = np.clip(nrm @ hv, 0, 1)
    col += (is_button * (spec ** 60) * 1.2 * sh)[:, None]
    col += (is_snout * (spec ** 18) * 0.08 * sh)[:, None]
    col *= (0.4 + 0.6 * occ)[:, None]
    rgb[hi] = col
    alpha[hi] = 1.0

    # --------------------------------------------- fluffy silhouette: stray hairs around the fur
    miss = np.nonzero(~hit & (min_df < 0.9))[0]
    if len(miss):
        mp = min_pos[miss]
        hair = vnoise(mp * np.array([2.0, 0.6, 2.0]))
        a = np.clip(1 - min_df[miss] / 0.9, 0, 1) * np.clip(hair * 1.6 - 0.3, 0, 1)
        nn = np.zeros_like(mp)
        for k in range(3):
            o = np.zeros(3); o[k] = 0.3
            nn[:, k] = sd_fur_base(mp + o) - sd_fur_base(mp - o)
        nn /= np.linalg.norm(nn, axis=-1, keepdims=True) + 1e-9
        lit = np.clip((nn @ L1 + 0.5) / 1.5, 0, 1)
        rgb[miss] = (fur * 0.6 + fur_light * 0.4) * (0.45 + 0.75 * lit)[:, None]
        alpha[miss] = a * 0.85

    rgb = np.clip(rgb, 0, 1) ** (1 / 2.2)
    img = np.concatenate([rgb, alpha[:, None]], -1).reshape(n, n, 4)
    print('done', time.time() - t0)
    return img


if __name__ == '__main__':
    img = render()
    im = Image.fromarray((img * 255 + 0.5).astype(np.uint8), 'RGBA')
    # premultiplied downsample for clean anti-aliased edges
    if len(sys.argv) > 3:
        im = im.resize((int(sys.argv[3]),) * 2, Image.LANCZOS, reducing_gap=None)
    im.save(OUT)
    # anchor points for the SVG overlay (eyes, mouth, nose, head)
    def surf_z(x, y, c, r):
        return c[2] + r[2] * np.sqrt(max(0.0, 1 - ((x - c[0]) / r[0]) ** 2 - ((y - c[1]) / r[1]) ** 2))
    eyes = [project((s * 5.0, 77.0, surf_z(s * 5.0, 77.0, *HEAD))) for s in (-1, 1)]
    mouth = [project((x, 56.0, surf_z(x, 56.0, *SNOUT) + 0.1)) for x in np.linspace(-10, 10, 9)]
    nose = [project((s * 2.6, 68.5, surf_z(s * 2.6, 68.5, *SNOUT))) for s in (-1, 1)]
    anchors = {
        'eyes': eyes, 'mouth': mouth, 'nose': nose,
        'headCenter': project(HEAD[0]), 'headTop': project((0, 96.0, 0.8)),
        'neck': project((0, 52.5, 11.0)), 'snoutBottom': project((0, 53.4, 10.0)),
    }
    print(json.dumps(anchors))

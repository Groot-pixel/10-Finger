"""Ray-marched 3D render of Flowy, the plush monkey mascot (signed distance fields, numpy + Pillow).

Usage:  python3 scripts/render-mascot.py <layer> <render-res> <out.png> [<output-res>]
        layer = base | cap | crown | glasses | bandana

`base` is the plush itself. The accessory layers contain only the accessory, rendered with the same
camera and light, and hidden wherever the plush is in front of it, so they can simply be stacked.

Proportions follow photos of the real toy: one big egg-shaped body without a neck, a big round head
sitting on it, short flipper arms, stubby legs, a light-bulb shaped cream face whose snout bulges far
forward, an egg-shaped cream belly with an embroidered blue button.

World units: y up, z towards the camera, feet at y = 0. Orthographic camera tilted down by PITCH.
SVG viewBox mapping: vbx = 50 + q.x * SCALE, vby = Y0 - q.y * SCALE, with q = Rx(PITCH) p.
"""
import json
import sys
import time

import numpy as np
from PIL import Image

LAYER = sys.argv[1] if len(sys.argv) > 1 else 'base'
RES = int(sys.argv[2]) if len(sys.argv) > 2 else 384
OUT = sys.argv[3] if len(sys.argv) > 3 else f'{LAYER}.png'
DOWN = int(sys.argv[4]) if len(sys.argv) > 4 else None

PITCH = np.radians(5.0)
Y0 = 96.5
SCALE = 0.885
cP, sP = np.cos(PITCH), np.sin(PITCH)


def to_cam(p):
    return np.stack([p[..., 0], p[..., 1] * cP - p[..., 2] * sP, p[..., 1] * sP + p[..., 2] * cP], -1)


def to_world(q):
    return np.stack([q[..., 0], q[..., 1] * cP + q[..., 2] * sP, -q[..., 1] * sP + q[..., 2] * cP], -1)


def project(p):
    q = to_cam(np.asarray(p, float))
    return [round(50 + float(q[0]) * SCALE, 2), round(Y0 - float(q[1]) * SCALE, 2)]


# ------------------------------------------------------------------ noise
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
    n = [_hash(x + a, y + b, z + c) for c in (0, 1) for b in (0, 1) for a in (0, 1)]
    ux, uy, uz = u[:, 0], u[:, 1], u[:, 2]
    a0 = n[0] + (n[1] - n[0]) * ux; a1 = n[2] + (n[3] - n[2]) * ux
    b0 = n[4] + (n[5] - n[4]) * ux; b1 = n[6] + (n[7] - n[6]) * ux
    e = a0 + (a1 - a0) * uy; g = b0 + (b1 - b0) * uy
    return e + (g - e) * uz


def _rand3(ix, iy, iz):
    return np.stack([_hash(ix, iy, iz), _hash(iy + 101, iz + 7, ix + 33), _hash(iz + 59, ix + 211, iy + 3)], -1)


def worley(p):
    """distance to the nearest of a set of jittered points (one per unit cell): round 'locks'"""
    i = np.floor(p).astype(np.int64)
    best = np.full(len(p), 9.0)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for dz in (-1, 0, 1):
                cx, cy, cz = i[:, 0] + dx, i[:, 1] + dy, i[:, 2] + dz
                fp = np.stack([cx, cy, cz], -1) + 0.15 + 0.7 * _rand3(cx, cy, cz)
                best = np.minimum(best, np.sum((fp - p) ** 2, -1))
    return np.sqrt(best)


def fbm(p, octaves=3):
    s, amp, tot, q = 0.0, 0.5, 0.0, p.copy()
    for _ in range(octaves):
        s = s + amp * vnoise(q)
        tot += amp
        q = q * 2.03 + 17.1
        amp *= 0.5
    return s / tot


# ------------------------------------------------------------------ primitives
def sd_ellipsoid(p, c, r):
    q = (p - np.asarray(c)) / np.asarray(r)
    k0 = np.linalg.norm(q, axis=-1)
    k1 = np.linalg.norm(q / np.asarray(r), axis=-1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-6)


def sd_sphere(p, c, r):
    return np.linalg.norm(p - np.asarray(c), axis=-1) - r


def sd_cone(p, a, b, ra, rb):
    a = np.asarray(a); b = np.asarray(b)
    pa = p - a; ba = b - a
    h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    return np.linalg.norm(pa - h[:, None] * ba, axis=-1) - (ra + (rb - ra) * h)


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b + (a - b) * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


# ------------------------------------------------------------------ the plush
BODY = ((0, 36.5, 0), (26.5, 26.5, 20.5))
HEAD = ((0, 79.5, 1.0), (19.5, 19.0, 18.0))
SNOUT = ((0, 71.2, 13.6), (15.4, 11.0, 11.2))
NOSE = ((0, 79.2, 19.2), (3.4, 2.0, 1.8))
EARS = [((s * 19.0, 86.0, 0.0), (6.4, 6.6, 3.2)) for s in (-1, 1)]
BELLY = (0.4, 34.5, 12.6, 15.0)  # centre x, y and half width / height of the egg-shaped cream patch
BUTTON = (0.0, 32.0, 3.7)        # centre x, y and radius of the embroidered button
EYE = (4.3, 86.4)                # |x|, y of the eyes


def body_z(x, y):
    (cx, cy, cz), (rx, ry, rz) = BODY
    return cz + rz * np.sqrt(np.clip(1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2, 0, 1))


def sd_plush_base(p):
    d = sd_ellipsoid(p, *BODY)
    d = smin(d, sd_ellipsoid(p, (0, 29.0, 1.0), (27.0, 18.0, 19.5)), 5.0)
    for s in (-1, 1):
        # short flipper arms, hanging slightly outwards from the upper body
        arm = sd_cone(p, (s * 19.5, 48.0, 4.0), (s * 30.5, 28.5, 5.5), 7.0, 6.4)
        d = smin(d, arm, 3.0)
        # stubby legs with round feet
        leg = sd_ellipsoid(p, (s * 11.2, 9.5, 3.5), (8.6, 10.0, 8.6))
        leg = smin(leg, sd_ellipsoid(p, (s * 11.6, 4.6, 6.5), (8.2, 5.0, 9.0)), 2.5)
        d = smin(d, leg, 2.5)
    head = sd_ellipsoid(p, *HEAD)
    for c, r in EARS:
        head = smin(head, sd_ellipsoid(p, c, r), 1.4)
    return smin(d, head, 3.5)


def sd_face(p):
    return sd_ellipsoid(p, *SNOUT)


def cream_mask(p):
    """short cream pile on the fur part: forehead/eye area, belly patch, inner ears (soft 0..1)"""
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    jit = (vnoise(p * 0.9) - 0.5) * 0.9
    # light-bulb face: narrow between the eyes, widening down into the snout
    half = 5.4 + np.clip(90.5 - y, 0, 30) * 0.55
    top = 90.6 + jit
    face = np.clip((half - np.abs(x) + jit) * 1.2, 0, 1) * np.clip((top - y) * 1.2, 0, 1) * (z > 6) * (y > 70)
    # egg-shaped belly (wider at the bottom)
    bx, by, bw, bh = BELLY
    w = bw * (1 + 0.12 * np.clip((by - y) / bh, -1, 1))
    e = ((x - bx) / w) ** 2 + ((y - by) / bh) ** 2
    belly = np.clip((1 - e) * 9 + jit * 2, 0, 1) * (z > 8)
    ear = np.zeros(len(p))
    for c, _ in EARS:
        ee = ((x - c[0]) / 4.0) ** 2 + ((y - c[1]) / 4.2) ** 2
        ear = np.maximum(ear, np.clip((1 - ee) * 6, 0, 1) * (z > c[2] + 0.5))
    return np.maximum(np.maximum(face, belly), ear)


FUR_MAX = 1.0


def fur_height(p, mask=None):
    """shaggy curly fur: rounded locks (cellular noise, a bit longer downwards), 0 on cream areas"""
    if mask is None:
        mask = cream_mask(p)
    clump = fbm(p * 0.36, 3) - 0.5
    strand = vnoise(p * np.array([1.2, 0.28, 1.2])) - 0.5
    h = 0.5 + clump * 0.85 + strand * 0.4
    return (1 - mask) * np.clip(h, 0, FUR_MAX)


def lock_shape(p):
    """soft, rounded curls of the shaggy fur, a bit longer downwards (0 between curls, 1 in the middle)"""
    q = p * np.array([0.22, 0.17, 0.22])
    lock = np.clip(1.0 - worley(q) * 1.15, 0, 1)
    return lock * lock * (3 - 2 * lock)


def surface_z(x, y):
    """z of the front of the (smooth) plush body at x, y"""
    lo, hi = 0.0, 40.0
    for _ in range(40):
        mid = (lo + hi) / 2
        if sd_plush_base(np.array([[x, y, mid]]))[0] > 0:
            hi = mid
        else:
            lo = mid
    return lo


def sd_button(p):
    bx, by, br = BUTTON
    z0 = BUTTON_Z
    q = p - np.array([bx, by, z0])
    r = np.hypot(q[:, 0], q[:, 1])
    # a flat felt disc, slightly domed, sewn onto the belly
    return smax(r - br, np.abs(q[:, 2] - 0.15) - 0.55 + 0.04 * (r / br) ** 2 * 0, 0.4)


# ---- accessories ---------------------------------------------------------------------------------
def sd_cap(p):
    c = np.array([0.0, 88.2, -1.0])
    dome = sd_ellipsoid(p, c, (19.2, 17.5, 19.0))
    dome = smax(dome, (c[1] + 4.0) - (p[:, 1] + 0.18 * p[:, 2]), 0.6)        # cut: only the top of the head
    dome = smax(dome, -sd_ellipsoid(p, c, (17.6, 16.2, 17.4)), 0.3)          # hollow shell
    # the peak points forward and a little down, like a real baseball cap
    q = p - np.array([0, 92.4, 12.0])
    tilt = -0.38  # peak tilted up a little, so it reads from the front
    qy = q[:, 1] * np.cos(tilt) + q[:, 2] * np.sin(tilt)
    qz = -q[:, 1] * np.sin(tilt) + q[:, 2] * np.cos(tilt)
    brim = sd_ellipsoid(np.stack([q[:, 0], qy, qz], -1), (0, 0, 3.5), (13.5, 0.85, 10.5))
    brim = smax(brim, -qz, 0.4)
    top = sd_sphere(p, (0, 105.5, 1.2), 1.5)
    return smin(smin(dome, brim, 1.0), top, 0.6)


def sd_crown(p):
    c = np.array([0.0, 96.5, 1.5])
    q = p - c
    r = np.hypot(q[:, 0], q[:, 2])
    ang = np.arctan2(q[:, 0], q[:, 2])
    saw = np.abs(((ang * 5 / np.pi) % 2) - 1)            # 0 at the points, 1 between them
    height = 7.5 - 3.6 * saw
    ring = smax(np.abs(r - 10.0) - 0.9, smax(-q[:, 1], q[:, 1] - height, 0.3), 0.3)
    balls = np.full(len(p), 1e9)
    for k in range(5):
        a = (k * 2 + 1) * np.pi / 5 - np.pi / 5 * 0
        a = k * 2 * np.pi / 5
        balls = np.minimum(balls, sd_sphere(p, c + np.array([10 * np.sin(a), 7.9, 10 * np.cos(a)]), 1.15))
    gem = sd_ellipsoid(p, c + np.array([0, 2.6, 10.9]), (1.7, 1.7, 0.9))
    return np.minimum(np.minimum(ring, balls), gem)


def sd_glasses(p):
    ex, ey = EYE
    zf = 19.9
    d = np.full(len(p), 1e9)
    for s in (-1, 1):
        q = p - np.array([s * (ex + 1.6), ey - 0.4, zf])
        lens = np.hypot(np.maximum(np.abs(q[:, 0]) - 2.4, 0), np.maximum(np.abs(q[:, 1]) - 1.2, 0)) - 3.1
        lens = smax(lens, np.abs(q[:, 2]) - 0.55, 0.3)
        d = np.minimum(d, lens)
        temple = sd_cone(p, (s * (ex + 6.8), ey + 1.2, zf - 0.8), (s * 17.0, ey + 2.0, 7.0), 0.55, 0.55)
        d = np.minimum(d, temple)
    bridge = sd_cone(p, (-1.6, ey + 0.6, zf + 0.3), (1.6, ey + 0.6, zf + 0.3), 0.55, 0.55)
    return np.minimum(d, bridge)


def sd_bandana(p):
    # a scarf lying on the chest just below the snout: shell over the body, cut to a triangle
    shell = np.abs(sd_plush_base(p) - 1.3) - 0.55
    x, y = p[:, 0], p[:, 1]
    tri = np.maximum(y - 61.5, np.abs(x) - (y - 42.0) * 0.8)
    band = np.maximum(y - 62.0, 57.5 - y)
    region = np.minimum(tri, band)
    knot = sd_ellipsoid(p, (0, 58.5, BANDANA_Z + 1.8), (2.6, 2.2, 1.6))
    return np.minimum(smax(shell, region, 0.5), knot)


BUTTON_Z = surface_z(BUTTON[0], BUTTON[1])
BANDANA_Z = surface_z(0, 58.5)

ACCESSORY = {'cap': sd_cap, 'crown': sd_crown, 'glasses': sd_glasses, 'bandana': sd_bandana}


def scene(p, detail=True):
    base = sd_plush_base(p)
    d_fur = base
    if detail:
        near = base < FUR_MAX + 0.5
        if near.any():
            d_fur = base.copy()
            d_fur[near] = base[near] - fur_height(p[near])
    else:
        d_fur = base - 0.3
    d_face = sd_face(p)
    d_btn = sd_button(p)
    d = np.minimum(smin(d_fur, d_face, 1.2), d_btn)
    d_acc = ACCESSORY[LAYER](p) if LAYER in ACCESSORY else np.full(len(p), 1e9)
    return np.minimum(d, d_acc), d_fur, d_face, d_btn, d_acc


# ------------------------------------------------------------------ shading helpers
def lin(hexc):
    c = np.array([int(hexc[i:i + 2], 16) for i in (1, 3, 5)]) / 255.0
    return c ** 2.2


FUR_DARK, FUR, FUR_LIGHT = lin('#a8621c'), lin('#d9963d'), lin('#f3c57d')
CREAM, CREAM_SHADE = lin('#fbf3e3'), lin('#eadbbd')
BTN, BTN_DARK = lin('#3dbad8'), lin('#1d7f9c')


def render():
    t0 = time.time()
    n = RES
    px = (np.arange(n) + 0.5) / n * 100
    vbx, vby = np.meshgrid(px, px)
    q = np.stack([(vbx.ravel() - 50) / SCALE, (Y0 - vby.ravel()) / SCALE, np.full(n * n, 70.0)], -1)
    ro = to_world(q)
    rd = to_world(np.array([[0, 0, -1.0]]))[0]

    N = n * n
    t = np.zeros(N)
    hit = np.zeros(N, bool)
    alive = np.ones(N, bool)
    min_df = np.full(N, 1e9)
    min_pos = np.zeros((N, 3))
    # phase 1: march the smooth shapes, inflated by the maximum fur height
    for _ in range(120):
        idx = np.nonzero(alive)[0]
        if len(idx) == 0:
            break
        p = ro[idx] + t[idx, None] * rd
        base = sd_plush_base(p) - FUR_MAX
        d = np.minimum(np.minimum(base, sd_face(p)), sd_button(p))
        if LAYER in ACCESSORY:
            d = np.minimum(d, ACCESSORY[LAYER](p))
        better = base + FUR_MAX < min_df[idx]
        min_df[idx[better]] = base[better] + FUR_MAX
        min_pos[idx[better]] = p[better]
        stop = d < 0.05
        alive[idx[stop]] = False
        t[idx[~stop]] += np.maximum(d[~stop], 0.05)
        alive[idx[t[idx] > 140]] = False
    alive = t < 140
    min_df[:] = 1e9
    # phase 2: refine with the curly fur
    for _ in range(60):
        idx = np.nonzero(alive)[0]
        if len(idx) == 0:
            break
        p = ro[idx] + t[idx, None] * rd
        d, df, *_ = scene(p)
        better = df < min_df[idx]
        min_df[idx[better]] = df[better]
        min_pos[idx[better]] = p[better]
        h = d < 0.02
        hit[idx[h]] = True
        alive[idx[h]] = False
        t[idx[~h]] += np.maximum(d[~h] * 0.6, 0.02)
        alive[idx[(~h) & (d > FUR_MAX + 3)]] = False
        alive[idx[t[idx] > 140]] = False
    print('march', round(time.time() - t0, 1), int(hit.sum()), file=sys.stderr)

    rgb = np.zeros((N, 3))
    alpha = np.zeros(N)

    hi = np.nonzero(hit)[0]
    p = ro[hi] + t[hi, None] * rd
    nrm = np.zeros_like(p)
    for k in range(3):
        o = np.zeros(3); o[k] = 0.3
        nrm[:, k] = scene(p + o)[0] - scene(p - o)[0]
    nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True) + 1e-9

    _, df, dface, dbtn, dacc = scene(p)
    m = np.minimum(np.minimum(df, dface), dbtn)
    is_acc = dacc <= m + 0.03
    is_btn = (~is_acc) & (dbtn <= np.minimum(df, dface) + 0.05)
    is_face = (~is_acc) & (~is_btn) & (dface < df + 0.2)
    cmask = np.where(is_face, 1.0, cream_mask(p))

    # --- albedo
    fh = lock_shape(p)                                               # middle of the curls is lighter
    streak = fbm(p * np.array([0.7, 0.22, 0.7]) + 9.0, 3)
    fine = vnoise(p * np.array([1.4, 0.35, 1.4]))                   # fine hair strands
    tone = np.clip(0.42 + 0.16 * fh + 0.55 * (streak - 0.5) + 0.3 * (fine - 0.5), 0, 1)
    fur_alb = np.where((tone < 0.5)[:, None], FUR_DARK + (FUR - FUR_DARK) * (tone / 0.5)[:, None],
                       FUR + (FUR_LIGHT - FUR) * ((tone - 0.5) / 0.5)[:, None])
    cream_alb = CREAM_SHADE + (CREAM - CREAM_SHADE) * (0.6 + 0.4 * vnoise(p * 1.5))[:, None]
    alb = fur_alb + (cream_alb - fur_alb) * cmask[:, None]

    # embroidered button: outer stitched ring, X stitch in the middle
    bx, by, br = BUTTON
    u = (p[:, 0] - bx) / br
    v = (p[:, 1] - by) / br
    r = np.hypot(u, v)
    ring = np.abs(r - 0.74) < 0.08
    xst = (np.abs(np.abs(u) - np.abs(v)) < 0.09) & (r < 0.34)
    btn_alb = np.where((ring | xst)[:, None], BTN_DARK, BTN * (0.92 + 0.12 * vnoise(p * 6))[:, None])
    alb = np.where(is_btn[:, None], btn_alb, alb)

    # accessories
    spec_k = np.zeros(len(p)); spec_p = np.full(len(p), 20.0)
    if LAYER == 'cap':
        cap = lin('#1cb0f6')
        seam = (np.abs(p[:, 0]) < 0.25) & (p[:, 1] > 94.5)
        under = (p[:, 1] < 93.0) & (p[:, 2] > 12)
        alb = np.where(is_acc[:, None], np.where((seam | under)[:, None], lin('#1480b3'), cap), alb)
        spec_k = np.where(is_acc, 0.12, 0)
    elif LAYER == 'crown':
        gem = (p[:, 2] > 11) & (np.abs(p[:, 0]) < 2) & (np.abs(p[:, 1] - 99.1) < 2)
        alb = np.where(is_acc[:, None], np.where(gem[:, None], lin('#ff3b4e'), lin('#ffc21a')), alb)
        spec_k = np.where(is_acc, 0.9, 0); spec_p = np.where(is_acc, 40.0, 20.0)
    elif LAYER == 'glasses':
        alb = np.where(is_acc[:, None], lin('#1d1d22'), alb)
        spec_k = np.where(is_acc, 1.0, 0); spec_p = np.where(is_acc, 70.0, 20.0)
    elif LAYER == 'bandana':
        dots = vnoise(np.floor(p * 0.55) + 0.5)
        cell = p * 0.55 - np.floor(p * 0.55) - 0.5
        dot = (np.hypot(cell[:, 0], cell[:, 1]) < 0.17) & (dots > 0.0)
        alb = np.where(is_acc[:, None], np.where(dot[:, None], lin('#ffffff'), lin('#ef3b3b')), alb)
        spec_k = np.where(is_acc, 0.05, 0)

    # --- lighting: soft studio light from the upper left, plus fill and sky
    view = -rd
    L1 = np.array([-0.45, 0.85, 0.55]); L1 /= np.linalg.norm(L1)
    L2 = np.array([0.75, 0.2, 0.6]); L2 /= np.linalg.norm(L2)

    def soft_shadow(pp, L, k=5.0):
        res = np.ones(len(pp))
        tt = np.full(len(pp), 0.4)
        for _ in range(34):
            d = scene(pp + tt[:, None] * L, detail=False)[0]
            res = np.minimum(res, k * d / tt)
            tt += np.clip(d, 0.3, 4.0)
        return np.clip(res, 0, 1)

    def ambient_occ(pp, nn):
        occ = np.zeros(len(pp)); sca = 1.0
        for i in range(1, 6):
            h = 1.4 * i
            d = scene(pp + nn * h, detail=False)[0]
            occ += (h - d) * sca
            sca *= 0.7
        return np.clip(1 - 0.07 * occ, 0, 1)

    sh = soft_shadow(p + nrm * 0.8, L1)
    occ = ambient_occ(p, nrm)
    wrap = 0.45
    dif1 = np.clip((nrm @ L1 + wrap) / (1 + wrap), 0, 1) * (0.3 + 0.7 * sh)
    dif2 = np.clip((nrm @ L2 + 0.25) / 1.25, 0, 1)
    ndv = np.clip(nrm @ view, 0, 1)
    sky = 0.55 + 0.45 * nrm[:, 1]
    col = alb * (dif1[:, None] * np.array([1.0, 0.97, 0.92]) * 1.05
                 + dif2[:, None] * np.array([0.85, 0.9, 1.0]) * 0.3
                 + (sky * occ)[:, None] * np.array([0.75, 0.75, 0.8]) * 0.45)
    # soft velvet sheen at grazing angles (plush)
    fres = (1 - ndv) ** 2.2
    furry = (~is_acc) & (~is_btn)
    col += (fres * 0.32 * furry * (0.4 + 0.6 * sh))[:, None] * np.where((cmask > 0.5)[:, None], CREAM, FUR_LIGHT)
    hv = L1 + view; hv /= np.linalg.norm(hv)
    spec = np.clip(nrm @ hv, 0, 1) ** spec_p * spec_k * sh
    col += spec[:, None]
    if LAYER == 'glasses':       # sky reflection on the lenses
        col += (is_acc * 0.25 * np.clip(nrm[:, 1] * 0.5 + 0.5, 0, 1) ** 3)[:, None]
    col *= (0.45 + 0.55 * occ)[:, None]

    rgb[hi] = col
    alpha[hi] = 1.0
    if LAYER in ACCESSORY:
        alpha[hi] = is_acc.astype(float)
    else:
        # fluffy edge: a few stray fur fibres just outside the silhouette
        miss = np.nonzero(~hit & (min_df < 0.8))[0]
        if len(miss):
            mp = min_pos[miss]
            hair = vnoise(mp * np.array([1.6, 0.5, 1.6]))
            a = np.clip(1 - min_df[miss] / 0.8, 0, 1) * np.clip(hair * 1.6 - 0.35, 0, 1)
            rgb[miss] = (FUR * 0.5 + FUR_LIGHT * 0.5) * 0.95
            alpha[miss] = a * 0.8

    rgb = np.clip(rgb, 0, 1) ** (1 / 2.2)
    img = np.concatenate([rgb, alpha[:, None]], -1).reshape(n, n, 4)
    print('done', round(time.time() - t0, 1), file=sys.stderr)
    return img


if __name__ == '__main__':
    img = render()
    im = Image.fromarray((img * 255 + 0.5).astype(np.uint8), 'RGBA')
    if DOWN:
        # premultiply so the transparent edge does not get a dark fringe
        a = np.asarray(im).astype(np.float64) / 255
        pm = np.concatenate([a[..., :3] * a[..., 3:], a[..., 3:]], -1)
        pm = np.asarray(Image.fromarray((pm * 255).astype(np.uint8), 'RGBA').resize((DOWN, DOWN), Image.LANCZOS)) / 255
        un = np.concatenate([pm[..., :3] / np.maximum(pm[..., 3:], 1e-4), pm[..., 3:]], -1)
        im = Image.fromarray((np.clip(un, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')
    im.save(OUT)

    def head_z(x, y):
        (cx, cy, cz), (rx, ry, rz) = HEAD
        return cz + rz * np.sqrt(max(0.0, 1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2))

    def snout_z(x, y):
        (cx, cy, cz), (rx, ry, rz) = SNOUT
        return cz + rz * np.sqrt(max(0.0, 1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2))

    ex, ey = EYE
    anchors = {
        'eyes': [project((s * ex, ey, head_z(s * ex, ey))) for s in (-1, 1)],
        'mouth': [project((x, 64.4, snout_z(x, 64.4))) for x in (-10.5, -5, 0, 5, 10.5)],
        'eyeRadius': round(1.75 * SCALE, 2),
    }
    print(json.dumps(anchors))

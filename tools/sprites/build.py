#!/usr/bin/env python3
"""Sprite builder. Every character is drawn from one hand-designed chibi base:
a round head with a drawn face, a hairstyle built from the cut described in
cast.py (silhouette, fringe, shading, shine), and a small body that the pose
table moves. The photos are only looked at; no pixel comes from them.

usage: python3 tools/sprites/build.py            (run from the repo root)
writes previews to tools/sprites/preview/ and the game sheets to game/sprites/<id>.png
(one row of 48x48 frames: idle 4, run 6, jump 2, roll 3, cast 3, hurt 1, ko 1, wave 2).
"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))
from cast import CAST, SKIN, HAIR

HERE = os.path.dirname(os.path.abspath(__file__))
ONLY = sys.argv[1:]
FW, FH, CX, GROUND = 48, 48, 24, 46            # frame; feet stand on row GROUND
# head-local canvas: the skull is 20 wide and 19 tall with its corner at (OX, OY)
LW, LH, OX, OY = 36, 52, 8, 8
FACES = {    # half-width of each skull row, top to chin
    'round':  [5, 7, 8, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 9, 9, 8, 7, 5],
    'oval':   [4, 6, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 7, 6, 4],
    'long':   [4, 6, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 8, 7, 5],
    'square': [6, 8, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 9, 9, 7],
    'heart':  [5, 7, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 9, 8, 7, 6, 5, 3],
    'soft':   [5, 7, 8, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 9, 8, 6],
    'slim':   [4, 6, 7, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 8, 7, 5, 3],
}
EYE_L, EYE_R, EYE_Y = 5, 13, 9                  # left column of each 2 px eye, top row
INK = (30, 24, 44)
END = {'short': None, 'ear': 14, 'chin': 17, 'shoulder': 23, 'long': 29, 'xlong': 32}

def mix(a, b, t): return tuple(max(0, min(255, round(int(a[i]) + (int(b[i]) - int(a[i])) * t))) for i in range(3))
def darker(c, t=0.3): return mix(c, (36, 26, 60), t)
def lighter(c, t=0.3): return mix(c, (255, 246, 214), t)

def skull_mask(hw_rows):
    m = np.zeros((LH, LW), bool)
    for sy, hw in enumerate(hw_rows): m[OY + sy, OX + 10 - hw:OX + 10 + hw] = True
    return m

def fringe(h, x, e):
    """Last skull row the front hair covers in skull column x (e = first face column)."""
    b = h['bangs']; d = abs(x + 0.5 - h['part']) / 9.5
    if b == 'none': v = 0.6 + d ** 1.7 * 7.4
    elif b == 'curtain': v = 2.4 + d ** 1.15 * 6.0
    elif b == 'split': v = 1.2 + d ** 0.8 * 7.2 if d > 0.06 else 0   # 5-5 split: centre parting, both sides falling to the brows
    elif b == 'full': v = 7 + (0 if 2 <= x <= 17 else 1) - (1 if x % 3 == 1 else 0)
    elif b == 'messy': v = [7, 8, 6, 7, 8, 7, 5, 7, 8, 6, 7, 7, 5, 6, 8, 7, 6, 8, 7, 8][x]
    elif b == 'wispy': v = 7 if x in (4, 5, 8, 11, 14, 15) else 2.6 + d ** 2 * 5
    elif b == 'side':
        t = x + 0.5 - h['part']
        v = min(8, 2.2 + t * 0.5) if t > 0 else min(8, 2.6 - t * 1.5)
    elif b == 'quiff': v = 1.4 + d ** 2 * 2.6
    elif b == 'peak': v = 1.2 + min(1.0, d * 3) * 1.2 + d ** 2 * 2.8      # small widow's peak
    else: v = 1.8 + d ** 2 * 3.4                 # 'short'
    lock = h['lock'] if h['lock'] is not None else {'short': 8, 'ear': 12}.get(h['length'], 14)
    if x <= e + 1 or x >= 18 - e: v = max(v, lock)
    if h['length'] != 'short' and (x == e + 2 or x == 17 - e): v = max(v, lock - 5)
    return int(round(v))

def hair_layers(h, hw_rows):
    """Returns (back, front) boolean masks and a tone map (0 shadow, 1 base, 2 shine)."""
    S = skull_mask(hw_rows); e = 10 - max(hw_rows)
    vs, vt = h['vol']; L = h['length']; tex = h['texture']
    cap_row = 7 if L == 'short' else 12
    back = np.zeros_like(S)
    yy, xx = np.mgrid[0:LH, 0:LW]
    ys, xs = np.where(S[:OY + cap_row + 1])
    for y in range(OY + cap_row + 1):
        for x in range(LW):
            back[y, x] = np.any(((x - xs) / (vs + 0.5)) ** 2 + ((y - ys) / (vt + 0.5)) ** 2 <= 1)
    end = END[L]
    taper = {'ear': [1, 3], 'chin': [1, 2, 4], 'shoulder': [1, 2], 'long': [1, 2, 3], 'xlong': [1, 2, 3]}.get(L, [])
    if end:
        for sy in range(cap_row + 1, end + 1):
            t = sy - (end - len(taper))
            inset = taper[t - 1] if t >= 1 else 0
            w = 0
            if tex == 'wavy': w = round(0.9 * math.sin((sy - cap_row) * 1.0))
            if tex == 'curly': w = 1 if sy % 3 == 1 else 0
            if L == 'shoulder' and sy >= 19 and tex == 'straight': w += 1   # rests on the shoulders and flares
            back[OY + sy, OX + e - vs + inset - w:OX + 20 - e + vs - inset + w] = True
    if h['bangs'] == 'quiff':
        back |= ((xx - (OX + 11)) / 7.5) ** 2 + ((yy - (OY - 2)) / 4.4) ** 2 <= 1
    if h.get('pigtails'):                             # two low bunches tied below the ears
        for cx in (OX + e - 1.5, OX + 20 - e + 0.5):
            back |= ((xx - cx) / 2.8) ** 2 + ((yy - (OY + 17)) / 4.2) ** 2 <= 1
    front = np.zeros_like(S)
    for sx in range(20):
        f = fringe(h, sx, e)
        for sy in range(0, min(len(hw_rows) - 1, f) + 1):
            if S[OY + sy, OX + sx]: front[OY + sy, OX + sx] = True
    if tex == 'curly':                               # bumpy outline
        edge = back & ~(np.roll(back, 1, 0) & np.roll(back, -1, 0) & np.roll(back, 1, 1) & np.roll(back, -1, 1))
        back &= ~(edge & ((xx * 3 + yy * 3) % 9 < 3) & ~S)

    tone = np.ones((LH, LW), np.uint8)
    allh = back | front
    top = np.where(allh.any(0), allh.argmax(0), 999)
    if tex == 'curly':
        cell = (yy // 3) % 2
        lx, ly = (xx + cell * 2) % 3, yy % 3
        tone[(lx == 2) & (ly == 2)] = 0                               # each curl: shaded lower right,
        tone[(lx == 0) & (ly == 0) & (yy < OY + 6) & (xx < OX + 14)] = 2    # lit where the light lands
    else:
        depth = yy - top[None, :]
        band = ((depth == 2) | (depth == 3)) & (xx >= OX + 2) & (xx <= OX + 16) & ((xx - OX) % 6 != 4)
        band &= np.abs(xx - OX + 0.5 - h['part']) > 0.9          # the parting stays dark
        tone[band] = 2
        strands = (yy >= OY + 15) & ((xx - OX) % 3 == 0) & back
        tone[strands] = 0
    tone[(yy > OY + 13) & (xx >= OX + 2) & (xx <= OX + 17) & back] = 0     # hair behind the neck is in shade
    tone[(xx >= OX + 19 - e + vs) & (yy > OY + 2)] = 0                       # side away from the light
    low = back & ~np.roll(back, -1, 0) & (yy > OY + cap_row)                 # ends
    tone[low] = 0
    return back, front, tone

EYE_SHAPES = {     # (x offset for the left eye, x offset for the right eye, y offset, rows)
    'round':  (0, 0, 0, ['DD', 'WD', 'ID']),
    'big':    (-1, 0, 0, ['DDD', 'WID', 'IID']),
    'narrow': (0, 0, 1, ['DD', 'WD']),
    'dot':    (0, 0, 1, ['WD', 'DD']),
}

def draw_head(c, eyes='open'):
    """Returns back-hair and front (face + front hair) RGBA layers on the head canvas."""
    h = c['hair']; ramp = list(HAIR[h['color']])
    skin, skin_sh = SKIN[c['skin']]
    hw_rows = FACES[c.get('face', 'round')]; chin = len(hw_rows) - 1; e = 10 - max(hw_rows)
    S = skull_mask(hw_rows); back, front, tone = hair_layers(h, hw_rows)
    bl = np.zeros((LH, LW, 4), np.uint8); fl = np.zeros((LH, LW, 4), np.uint8)
    end_row = OY + (END[h['length']] or 0)
    def hair_col(x, y):
        col = ramp[tone[y, x]]
        if h.get('streaks') and tone[y, x] == 1 and (x - OX) % 4 == 1 and y > OY + 3: col = h['streaks']
        if h.get('ends') and y > end_row - 7 and tone[y, x] > 0:
            col = mix(col, h['ends'], min(1, (y - (end_row - 7)) / 4))
        return col
    for y in range(LH):
        for x in range(LW):
            if back[y, x]: bl[y, x] = (*hair_col(x, y), 255)
    def P(sx, sy, col):
        x, y = OX + sx, OY + sy
        if 0 <= x < LW and 0 <= y < LH: fl[y, x] = (*col, 255)
    # face
    for sy, hw in enumerate(hw_rows):
        for sx in range(10 - hw, 10 + hw):
            P(sx, sy, skin_sh if (sx == 10 + hw - 1 and sy >= 4) else skin)
    hwc = hw_rows[chin]
    for sx in range(10 - hwc + 1, 10 + hwc - 1): P(sx, chin, skin_sh)       # under the chin
    extra = c.get('extra', [])
    if h['length'] == 'short':                                       # ears show with short hair
        for sy in (9, 10, 11): P(e - 1, sy, skin); P(20 - e, sy, skin_sh)
        P(e - 1, 11, skin_sh)
    dark = (44, 30, 44); iris = c.get('iris', (96, 60, 48)); white = (255, 255, 255)
    kind = c.get('eyes', 'round'); g = c.get('glasses')
    ey = EYE_Y
    lens = mix(skin, (255, 255, 255), 0.5)
    if g:                                             # lenses first, so the eyes sit on them
        for x0 in (EYE_L - 1, EYE_R - 1):
            for sy in range(EYE_Y, EYE_Y + 3):
                for sx in range(x0, x0 + 3): P(sx, sy, lens)
    if eyes == 'closed' or kind == 'happy':
        # closed: a flat line. happy: an arch, the eyes of someone mid-laugh
        for x0 in (EYE_L, EYE_R):
            if kind == 'happy' and eyes != 'closed':
                P(x0, ey + 1, dark); P(x0 + 1, ey + 1, dark); P(x0 - 1, ey + 2, dark); P(x0 + 2, ey + 2, dark)
            else:
                for i in range(-1 if not g else 0, 3 if not g else 2): P(x0 + i, ey + 1, dark)
        brow_y = 7
    else:
        ol, orr, oy, rows = EYE_SHAPES[kind]
        for x0 in (EYE_L + ol, EYE_R + orr):
            for j, row in enumerate(rows):
                for i, ch in enumerate(row):
                    col = {'D': dark, 'W': white, 'I': iris}.get(ch)
                    if col: P(x0 + i, ey + oy + j, col)
        if c.get('lash') and not g:
            P(EYE_L + ol - 1, ey + oy, dark); P(EYE_R + orr + len(rows[0]), ey + oy, dark)
            P(EYE_L + ol - 1, ey + oy - 1, dark); P(EYE_R + orr + len(rows[0]), ey + oy - 1, dark)
        brow_y = 7 + oy
    if g: brow_y = 6                                  # brows clear the frames
    brow = mix(ramp[0], skin, 0.2); bk = c.get('brows', 'flat')
    L0, R0 = EYE_L, EYE_R
    if bk == 'flat':
        for i in (-1, 0, 1): P(L0 + i, brow_y, brow); P(R0 + 1 + i + 0, brow_y, brow)
    elif bk == 'thin':
        for i in (0, 1): P(L0 + i, brow_y, brow); P(R0 + i, brow_y, brow)
    elif bk == 'arched':
        P(L0 - 1, brow_y, brow); P(L0, brow_y - 1, brow); P(L0 + 1, brow_y - 1, brow)
        P(R0, brow_y - 1, brow); P(R0 + 1, brow_y - 1, brow); P(R0 + 2, brow_y, brow)
    elif bk == 'angled':
        P(L0 - 1, brow_y - 1, brow); P(L0, brow_y - 1, brow); P(L0 + 1, brow_y, brow); P(L0 + 2, brow_y, brow)
        P(R0 - 1, brow_y, brow); P(R0, brow_y, brow); P(R0 + 1, brow_y - 1, brow); P(R0 + 2, brow_y - 1, brow)
    elif bk == 'thick':
        for i in (-1, 0, 1, 2): P(L0 + i, brow_y - 1, brow); P(R0 - 1 + i, brow_y - 1, brow)
        for i in (0, 1): P(L0 + i, brow_y, brow); P(R0 + i, brow_y, brow)
    blush = mix(skin, (255, 110, 124), 0.5 if c.get('rosy') else 0.38)
    P(e + 2, 13, blush); P(e + 3, 13, blush); P(16 - e, 13, blush); P(17 - e, 13, blush)
    if c.get('rosy'): P(e + 2, 12, blush); P(e + 3, 12, blush); P(16 - e, 12, blush); P(17 - e, 12, blush)
    if c.get('freckles'):
        fk = mix(skin, (150, 90, 60), 0.5)
        for sx, sy in ((e + 3, 12), (e + 5, 13), (15 - e, 13), (17 - e, 12), (9, 13)): P(sx, sy, fk)
    P(10, 12, skin_sh)                                               # nose
    if c.get('face') in ('long', 'square'): P(10, 11, skin_sh)
    if c.get('mole'): P(c['mole'][0], c['mole'][1], (120, 80, 70))
    lip = (196, 90, 102) if c['skin'] not in ('brown', 'tan') else (150, 70, 74)
    inside = (120, 44, 56)
    def draw_mouth():
        m = c.get('mouth', 'smile')
        if m == 'smile': P(9, 15, lip); P(10, 15, lip); P(8, 14, lip); P(11, 14, lip)
        elif m == 'small': P(9, 15, lip); P(10, 15, lip)
        elif m == 'smirk': P(9, 15, lip); P(10, 15, lip); P(11, 15, lip); P(12, 14, lip)
        elif m == 'grin':
            P(7, 14, lip); P(12, 14, lip)
            for sx in range(8, 12): P(sx, 14, white); P(sx, 15, lip)
        elif m == 'laugh':
            for sx in range(8, 12): P(sx, 14, white); P(sx, 15, inside)
            P(7, 14, lip); P(12, 14, lip); P(9, 16, lip); P(10, 16, lip)
    draw_mouth()
    if 'stubble' in extra or 'beard' in extra:
        bd = mix(skin, ramp[1], 0.66 if 'beard' in extra else 0.24)
        for sy in range(12, chin + 1):
            hw = hw_rows[sy]
            for sx in range(10 - hw, 10 + hw):
                band = 3 if sy < 15 else 4
                jaw = sy >= chin - 2 or sx < 10 - hw + band or sx >= 10 + hw - band
                if jaw: P(sx, sy, bd)
        if 'beard' in extra:
            for sx in range(7, 13): P(sx, 13, bd); P(sx, 16, bd)
            for sx in range(7, 13): P(sx, 14, bd); P(sx, 15, bd)
        draw_mouth()
    if 'moustache' in extra:
        for sx in range(8, 12): P(sx, 13, ramp[0])
        P(7, 14, ramp[0]); P(12, 14, ramp[0])
    # front hair, with a one-pixel shadow on the skin under it
    for sy in range(chin + 1):
        for sx in range(20):
            x, y = OX + sx, OY + sy
            if front[y, x]: fl[y, x] = (*hair_col(x, y), 255)
            elif S[y, x] and y > 0 and front[y - 1, x] and tuple(fl[y, x, :3]) == skin: fl[y, x] = (*skin_sh, 255)
    if g:
        fr = c.get('frame', dark)
        for x0, lens_x in ((EYE_L - 2, EYE_L - 1), (EYE_R - 1, EYE_R + 2)):       # frames are 5 wide, 5 tall
            for sx in range(x0, x0 + 5): P(sx, EYE_Y - 1, fr); P(sx, EYE_Y + 3, fr)
            for sy in range(EYE_Y, EYE_Y + 3): P(x0, sy, fr); P(x0 + 4, sy, fr)
            if g == 'round':
                for sx, sy in ((x0, EYE_Y - 1), (x0 + 4, EYE_Y - 1), (x0, EYE_Y + 3), (x0 + 4, EYE_Y + 3)):
                    P(sx, sy, hair_col(OX + sx, OY + sy) if front[OY + sy, OX + sx] else skin)
        for sx in range(EYE_L + 3, EYE_R - 1): P(sx, EYE_Y, fr)                   # bridge
        P(EYE_L - 3, EYE_Y, fr); P(EYE_R + 4, EYE_Y, fr)                          # start of the arms
    if 'shades_up' in extra:                                                      # sunglasses pushed up into the hair
        sd = (40, 34, 52)
        for x0 in (4, 11):
            for sx in range(x0, x0 + 5): P(sx, 0, sd); P(sx, 1, sd)
            P(x0 + 1, 0, (150, 140, 170))
        P(9, 0, sd); P(10, 0, sd)
    gold = (252, 214, 96)
    def both(sx_l, sy, col):
        for lay in (bl, fl): lay[OY + sy, OX + sx_l] = (*col, 255); lay[OY + sy, OX + 19 - sx_l] = (*col, 255)
    if 'earring' in extra: both(e - 1, 13, gold)
    if 'hoops' in extra: both(e - 1, 13, gold); both(e - 1, 15, gold); both(e - 2, 14, gold)
    if 'stud' in extra: both(e - 1, 12, (230, 230, 240))
    if 'stud_green' in extra: both(e, 13, (90, 200, 150))
    return bl, fl, chin

def line(x0, y0, x1, y1):
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    return [(round(x0 + (x1 - x0) * i / n), round(y0 + (y1 - y0) * i / n)) for i in range(n + 1)]

def render(c, layers, pose=None):
    """One 48x48 frame. `pose` moves the body:
      dy     upper body lower by this many pixels     lean  torso top shifted sideways
      head   (dx, dy) extra head offset               legs  [(dx, lift), (dx, lift)]
      toes   'out' standing | 'right' moving          arms  hand offset from each shoulder
      front  arms drawn over the head                 crouch  tucked body for the roll"""
    pose = pose or {}
    bl, fl, chin = layers
    f = np.zeros((FH, FW, 4), np.uint8)
    def px(x, y, col):
        if 0 <= x < FW and 0 <= y < FH: f[y, x] = (*col, 255)
    def R(x0, y0, x1, y1, col):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): px(x, y, col)
    def blit(layer, x0, y0, max_row=LH):
        for y in range(min(LH, max_row)):
            for x in range(LW):
                if layer[y, x, 3]: px(x0 + x, y0 + y, tuple(layer[y, x, :3]))
    skin, skin_sh = SKIN[c['skin']]
    top = c['top']; top_d = darker(top, 0.28); top_l = lighter(top, 0.18)
    jacket = c.get('jacket'); stripe = c.get('stripe'); extra = c.get('extra', [])
    pants = c.get('pants', (70, 88, 140)); pants_d = darker(pants, 0.3)
    shoe, sole = c.get('shoe', (240, 236, 226)), (120, 116, 130)
    tall, width = c.get('build', (0, 'mid'))
    wl, wr = {'slim': (4, 4), 'mid': (5, 4), 'broad': (6, 5)}[width]      # torso spans CX-wl .. CX+wr
    dy = pose.get('dy', 0); lean = pose.get('lean', 0); crouch = pose.get('crouch', False)
    hdx, hdy = pose.get('head', (0, 0))
    t1 = GROUND - 9 - tall - (1 if crouch else 0)                        # hips: taller people have longer legs
    t0 = t1 - 7 if crouch else t1 - 11 + dy                              # shoulders
    sh = lambda y: round(lean * (t1 - y) / max(1, t1 - t0))
    lx0 = CX - 10 - OX + lean + hdx; ly0 = t0 - chin - OY + hdy

    blit(bl, lx0, ly0, OY + chin + 2 if crouch else LH)
    if not crouch:
        legs = pose.get('legs', [(0, 0), (0, 0)]); toes = pose.get('toes', 'out')
        for i, (ldx, lift) in enumerate(legs):
            x0 = (CX - 5 if i == 0 else CX + 1) + ldx
            R(x0, t1 + 1, x0 + 3, GROUND - 2 - lift, pants if i == 0 else pants_d)
            px(x0 + 3, GROUND - 2 - lift, pants_d)
            tx0, tx1 = (x0, x0 + 4) if toes == 'right' or i == 1 else (x0 - 1, x0 + 3)
            R(tx0, GROUND - 1 - lift, tx1, GROUND - lift, shoe); R(tx0, GROUND - lift, tx1, GROUND - lift, sole)
        R(CX - 5, t1 + 1, CX + 4, t1 + 2, pants); R(CX + 2, t1 + 1, CX + 4, t1 + 2, pants_d)
    else:
        for x0 in (CX - 5, CX + 1): R(x0, t1 + 1, x0 + 4, t1 + 2, shoe); R(x0, t1 + 2, x0 + 4, t1 + 2, sole)
    for y in range(t0, t1 + 1):                        # torso
        s = sh(y)
        for x in range(CX - wl, CX + wr + 1):
            if y == t0 and x in (CX - wl, CX + wr): continue        # rounded shoulders
            shade_side = x >= CX + wr - 1 or y >= t1
            col = top_d if shade_side else top_l if x == CX - wl else top
            if stripe and (y - t0) % 2 == 1: col = stripe if not shade_side else darker(stripe, 0.25)
            if jacket and not (CX - 2 <= x <= CX + 1):               # open jacket over the top
                col = darker(jacket, 0.28) if shade_side else jacket
                if x in (CX - 3, CX + 2): col = darker(jacket, 0.4)   # lapel edge
            px(x + s, y, col)
    if not crouch:
        s = sh(t0 + 1); px(CX - 1 + s, t0 + 1, skin_sh); px(CX + s, t0 + 1, skin_sh)   # neckline
    if 'heart_pin' in extra:
        pink = (255, 124, 172); s = sh(t0 + 5)
        px(CX + 1 + s, t0 + 4, pink); px(CX + 3 + s, t0 + 4, pink); R(CX + 1 + s, t0 + 5, CX + 3 + s, t0 + 5, pink); px(CX + 2 + s, t0 + 6, pink)
    if 'pearls' in extra and not crouch:
        s = sh(t0 + 2); pearl = (250, 246, 236)
        px(CX - 2 + s, t0 + 1, pearl); px(CX + 1 + s, t0 + 1, pearl); px(CX - 1 + s, t0 + 2, pearl); px(CX + s, t0 + 2, pearl)
    if 'cross' in extra and not crouch:
        s = sh(t0 + 3); silver = (220, 224, 236)
        px(CX - 1 + s, t0 + 2, silver); px(CX - 1 + s, t0 + 3, silver); px(CX - 2 + s, t0 + 3, silver); px(CX + s, t0 + 3, silver); px(CX - 1 + s, t0 + 4, silver)
    if 'scarf' in extra and not crouch:
        sc, sc_d = (246, 240, 228), (206, 196, 190)
        for y in (t0, t0 + 1):
            for x in range(CX - 4, CX + 4): px(x + sh(y), y, sc if x < CX + 2 else sc_d)
        R(CX + 1 + sh(t0 + 3), t0 + 2, CX + 2 + sh(t0 + 3), t0 + 6, sc); R(CX + 2 + sh(t0 + 3), t0 + 2, CX + 2 + sh(t0 + 3), t0 + 6, sc_d)
    if 'lanyard' in extra and not crouch:
        cord = (252, 214, 96); s = sh(t0 + 3)
        for i in range(4): px(CX - 3 + i // 2 + s, t0 + 1 + i, cord); px(CX + 2 - i // 2 + s, t0 + 1 + i, cord)
        R(CX - 2 + s, t0 + 5, CX + 1 + s, t0 + 7, (244, 244, 244)); R(CX - 1 + s, t0 + 6, CX + s, t0 + 6, (90, 140, 220))
    if 'jersey' in extra:
        s = sh(t0 + 5)
        if not crouch: R(CX - 1 + s, t0 + 4, CX + s, t0 + 7, (244, 244, 244))
        for y in range(t0, t1 + 1): px(CX - wl + sh(y) + (1 if y == t0 else 0), y, (244, 244, 244))
    def arm(i):
        ax, ay = pose.get('arms', [(0, 7), (0, 7)])[i]
        if crouch: ax, ay = (2, 4) if i == 0 else (-2, 4)
        sx = (CX - wl - 2 if i == 0 else CX + wr + 1) + sh(t0 + 1); sy = t0 + 1
        pts = line(sx, sy, sx + ax, sy + ay)
        kind = c.get('sleeve', 'long') if not jacket else 'long'
        base = jacket or top
        for k, (x, y) in enumerate(pts):
            col = base if i == 0 else darker(base, 0.28)
            if stripe and not jacket and k % 2 == 1: col = stripe if i == 0 else darker(stripe, 0.25)
            bare = (kind == 'tee' and k >= 3) or (kind == 'tank' and k >= 1) or k >= len(pts) - 2
            if bare: col = skin if i == 0 else skin_sh
            px(x, y, col); px(x + 1, y, col); px(x, y + 1, col); px(x + 1, y + 1, col)
    front = pose.get('front', [0, 0])
    for i in (0, 1):
        if not front[i]: arm(i)
    blit(fl, lx0, ly0)
    for i in (0, 1):
        if front[i]: arm(i)
    return f

def outline(f):
    """Coloured outline: each edge pixel is a dark version of the colour it borders."""
    solid = f[..., 3] > 0
    out = f.copy()
    for y in range(FH):
        for x in range(FW):
            if solid[y, x]: continue
            for dx, dy in ((0, 1), (1, 0), (-1, 0), (0, -1)):
                j, i = y + dy, x + dx
                if 0 <= j < FH and 0 <= i < FW and solid[j, i]:
                    out[y, x] = (*mix(tuple(f[j, i, :3]), INK, 0.74), 255); break
    return out

def settle(f, turn=0):
    """Rotate by quarter turns (lossless) and stand the result on the ground, centred."""
    f = np.rot90(f, turn)
    ys, xs = np.where(f[..., 3] > 0)
    crop = f[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    out = np.zeros((FH, FW, 4), np.uint8)
    h, w = crop.shape[:2]
    x0 = max(0, min(FW - w, CX - w // 2)); y0 = GROUND + 2 - h
    out[y0:y0 + h, x0:x0 + w] = crop
    return out

def run_pose(i):
    a = i * math.pi / 3
    la = (round(3 * math.cos(a)), max(0, round(3 * math.sin(a))))
    lb = (round(-3 * math.cos(a)), max(0, round(-3 * math.sin(a))))
    return dict(dy=[0, 1, 0, 0, 1, 0][i], lean=1, toes='right', legs=[la, lb],
                arms=[(round(-2 * math.cos(a)), 6), (round(2 * math.cos(a)), 6)])

# name -> list of (pose, eyes). Order and counts follow GAME_PLAN.md section 5.
ANIMS = {
    'idle': [({}, 'open'), ({}, 'open'), ({'dy': 1}, 'open'), ({'dy': 1}, 'open')],
    'run': [(run_pose(i), 'open') for i in range(6)],
    'jump': [(dict(legs=[(-1, 2), (1, 3)], arms=[(-3, -2), (3, -3)], toes='right'), 'open'),
             (dict(legs=[(-2, 0), (2, 1)], arms=[(-4, 2), (4, 1)], head=(0, -1), toes='right'), 'open')],
    'roll': [(dict(crouch=True, turn=k), 'closed') for k in (3, 2, 1)],
    'cast': [(dict(lean=-1, arms=[(0, 7), (-2, 4)]), 'open'),
             (dict(lean=1, legs=[(-2, 0), (2, 0)], toes='right', arms=[(-1, 7), (7, -1)], front=[0, 1]), 'open'),
             (dict(lean=1, legs=[(-2, 0), (2, 0)], toes='right', arms=[(-1, 7), (7, 1)], front=[0, 1]), 'open')],
    'hurt': [(dict(lean=-2, head=(-1, 0), legs=[(-1, 0), (2, 2)], arms=[(-4, 3), (3, 1)], toes='right'), 'closed')],
    'ko': [(dict(turn=1, arms=[(-1, 7), (1, 7)]), 'closed')],
    'wave': [(dict(arms=[(0, 7), (3, -8)], front=[0, 1]), 'open'), (dict(arms=[(0, 7), (5, -7)], front=[0, 1]), 'open')],
}

def frames(cid):
    c = CAST[cid]
    heads = {e: draw_head(c, e) for e in ('open', 'closed')}
    out = []
    for name, seq in ANIMS.items():
        for k, (pose, eyes) in enumerate(seq):
            f = outline(render(c, heads[eyes], pose))
            if 'turn' in pose: f = settle(f, pose['turn'])
            out.append((name, k, f))
    return out

if __name__ == '__main__':
    os.makedirs(f'{HERE}/preview', exist_ok=True)
    ids = [i for i in CAST if not ONLY or i in ONLY]
    BG, WHITE_INK = (118, 124, 150), (255, 255, 255)
    Z, cw, chh = 5, 290, 262
    cols = 5 if len(ids) > 5 else len(ids); rows = -(-len(ids) // cols)
    sheet = Image.new('RGB', (cols * cw + 8, rows * chh + 8), BG)
    d = ImageDraw.Draw(sheet)
    allf = {}
    for k, cid in enumerate(ids):
        allf[cid] = frames(cid)
        im = Image.fromarray(allf[cid][0][2], 'RGBA')
        x, y = 8 + (k % cols) * cw, 8 + (k // cols) * chh
        big = im.resize((FW * Z, FH * Z), Image.NEAREST)
        sheet.paste(big, (x, y + 12), big)
        sheet.paste(im, (x + FW * Z - 6, y + 12 + FH * Z - FH), im)       # 1x, as in game
        d.text((x + 4, y), cid.upper(), fill=WHITE_INK)
    sheet.save(f'{HERE}/preview/contact_sheet.png')
    print('wrote preview/contact_sheet.png', sheet.size)

    # game sheets: one row of 48x48 frames per character, in ANIMS order
    out_dir = os.path.join(HERE, '..', '..', 'game', 'sprites')
    os.makedirs(out_dir, exist_ok=True)
    for cid in ids:
        fr = allf[cid]
        strip = Image.new('RGBA', (FW * len(fr), FH), (0, 0, 0, 0))
        for i, (_, _, f) in enumerate(fr): strip.paste(Image.fromarray(f, 'RGBA'), (i * FW, 0))
        strip.save(os.path.join(out_dir, f'{cid}.png'), optimize=True)
    print('wrote game/sprites/<id>.png for', len(ids), 'characters,', len(allf[ids[0]]), 'frames each:',
          ', '.join(f'{k} {len(v)}' for k, v in ANIMS.items()))

    pilots = [i for i in ('amelia', 'othmane', 'coco') if i in allf]
    if pilots:
        Z = 3; n = len(allf[pilots[0]]); per = 11
        ms = Image.new('RGB', (per * (FW * Z + 4) + 8, len(pilots) * 2 * (FH * Z + 16) + 8), BG)
        d = ImageDraw.Draw(ms)
        for r, cid in enumerate(pilots):
            for i, (name, k, f) in enumerate(allf[cid]):
                im = Image.fromarray(f, 'RGBA').resize((FW * Z, FH * Z), Image.NEAREST)
                x, y = 8 + (i % per) * (FW * Z + 4), 8 + (r * 2 + i // per) * (FH * Z + 16)
                d.rectangle([x, y + 12, x + FW * Z - 1, y + 12 + FH * Z - 1], fill=(132, 138, 164))
                ms.paste(im, (x, y + 12), im)
                d.text((x + 2, y), f'{name} {k + 1}', fill=WHITE_INK)
        ms.save(f'{HERE}/preview/motion_pilots.png')
        Z = 4; gif = []
        order = [('idle', 3, 180), ('run', 3, 90), ('jump', 2, 260), ('roll', 3, 100), ('cast', 2, 150), ('hurt', 1, 400), ('ko', 1, 700), ('wave', 3, 200)]
        for name, loops, ms_per in order:
            idx = [i for i, (nm, _, _) in enumerate(allf[pilots[0]]) if nm == name]
            for _ in range(loops):
                for i in idx:
                    fr = Image.new('RGB', (len(pilots) * FW * Z, FH * Z + 16), BG)
                    dd = ImageDraw.Draw(fr); dd.rectangle([0, (GROUND + 1) * Z, fr.size[0], fr.size[1]], fill=(84, 88, 112))
                    for cc, cid in enumerate(pilots):
                        im = Image.fromarray(allf[cid][i][2], 'RGBA').resize((FW * Z, FH * Z), Image.NEAREST)
                        fr.paste(im, (cc * FW * Z, 0), im)
                    dd.text((4, FH * Z + 2), name.upper(), fill=WHITE_INK)
                    gif.append((fr, ms_per))
        gif[0][0].save(f'{HERE}/preview/motion_pilots.gif', save_all=True, append_images=[g for g, _ in gif[1:]],
                       duration=[t for _, t in gif], loop=0)
        print('wrote preview/motion_pilots.png and .gif,', n, 'frames per hero')

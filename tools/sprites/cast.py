"""The cast, designed by hand. The photos are reference only: each entry
records what makes that person recognisable (face shape, eyes, brows, smile,
hair cut and colour, glasses, build, what they wear) and build.py draws it.
Top colours follow GAME_PLAN.md section 6.

face   'round' | 'oval' | 'long' | 'square' | 'heart' | 'soft' | 'slim'
eyes   'round' | 'big' | 'narrow' | 'dot' | 'happy'     iris: eye colour
brows  'flat' | 'arched' | 'angled' | 'thick' | 'thin'
mouth  'smile' | 'grin' | 'laugh' | 'small' | 'smirk'
build  (height, width): height -2..+2 pixels, width 'slim' | 'mid' | 'broad'
hair   see H() below
"""

SKIN = {   # base, shadow
    'light': ((248, 212, 184), (224, 168, 146)),
    'pale':  ((252, 222, 204), (230, 178, 164)),
    'fair':  ((242, 198, 166), (212, 154, 130)),
    'sun':   ((228, 178, 140), (194, 136, 106)),
    'tan':   ((212, 158, 120), (174, 118, 90)),
    'brown': ((172, 116, 84), (136, 84, 62)),
}
HAIR = {   # shadow, base, highlight
    'black':      ((28, 24, 40), (50, 44, 68), (92, 84, 118)),
    'dark':       ((44, 30, 32), (74, 52, 46), (116, 84, 66)),
    'darkbrown':  ((50, 32, 34), (84, 56, 50), (130, 92, 76)),
    'brown':      ((72, 44, 32), (114, 74, 50), (164, 116, 76)),
    'chestnut':   ((82, 50, 38), (128, 84, 58), (178, 128, 88)),
    'auburn':     ((88, 40, 32), (140, 72, 48), (192, 116, 76)),
    'rust':       ((96, 50, 34), (152, 88, 54), (202, 136, 88)),
    'lbrown':     ((94, 64, 44), (142, 102, 70), (190, 146, 104)),
    'red':        ((112, 34, 26), (178, 62, 38), (226, 118, 72)),
    'strawberry': ((156, 98, 62), (212, 154, 104), (244, 206, 156)),
}
NAVY, WHITE = (44, 58, 104), (236, 236, 228)
JEANS, DARK, KHAKI, GREY = (70, 88, 140), (50, 50, 70), (176, 150, 110), (110, 112, 128)
BROWN_EYE, DARK_EYE, BLUE_EYE, HAZEL_EYE = (96, 60, 48), (60, 40, 44), (92, 140, 190), (112, 122, 70)

def H(color, length, bangs, part=10, texture='straight', vol=(2, 2), lock=None, **kw):
    """length  'short' | 'ear' | 'chin' | 'shoulder' | 'long' | 'xlong'
    bangs   'none' (open forehead, parted) | 'curtain' | 'split' (5-5) | 'full' | 'messy' | 'wispy' |
            'side' (swept from the parting) | 'short' | 'peak' | 'quiff'
    part    skull column of the parting, 0..20 (10 = centre)
    vol     (side, top) pixels of volume beyond the skull
    lock    skull row the strands beside the face reach
    extras  pigtails=True, streaks=colour, ends=colour"""
    return dict(color=color, length=length, bangs=bangs, part=part, texture=texture, vol=vol, lock=lock, **kw)

CAST = {
    'xinxin':  dict(skin='light', face='oval', eyes='round', lash=True, brows='arched', mouth='grin', mole=(15, 12), build=(1, 'slim'),
                    hair=H('black', 'long', 'none', part=7, texture='wavy', vol=(2, 2)),
                    top=(58, 56, 80), sleeve='long', pants=JEANS, extra=['heart_pin', 'pearls']),
    'othmane': dict(skin='tan', face='square', eyes='round', brows='thick', mouth='grin', build=(1, 'broad'),
                    hair=H('dark', 'short', 'short', texture='curly', vol=(1, 3)),
                    top=NAVY, stripe=WHITE, sleeve='long', pants=DARK, extra=['stubble']),
    'amelia':  dict(skin='pale', face='heart', eyes='big', iris=BLUE_EYE, lash=True, brows='flat', mouth='grin', rosy=True, build=(1, 'slim'),
                    hair=H('auburn', 'long', 'none', part=10, texture='wavy', vol=(2, 2)),
                    top=(156, 158, 168), stripe=(110, 112, 126), sleeve='long', pants=DARK, extra=['earring']),
    'audrey':  dict(skin='light', face='round', eyes='narrow', brows='thin', mouth='laugh', rosy=True, build=(-1, 'mid'),
                    hair=H('darkbrown', 'long', 'wispy', vol=(2, 2)),
                    top=(136, 88, 180), sleeve='tee', pants=JEANS, glasses='round', frame=(200, 170, 120)),
    'iffy':    dict(skin='light', face='round', eyes='dot', brows='thin', mouth='smile', build=(-2, 'slim'),
                    hair=H('black', 'chin', 'full', vol=(2, 2)),
                    top=(44, 154, 154), sleeve='tee', pants=KHAKI, glasses='round', frame=(128, 118, 132)),
    'bikki':   dict(skin='brown', face='long', eyes='round', iris=DARK_EYE, brows='flat', mouth='grin', build=(2, 'slim'),
                    hair=H('black', 'short', 'quiff', vol=(0, 2), lock=5),
                    top=(150, 180, 226), jacket=(44, 52, 86), sleeve='long', pants=DARK, glasses='round', frame=(52, 46, 60), extra=['stud']),
    'coco':    dict(skin='sun', face='soft', eyes='round', iris=DARK_EYE, brows='flat', mouth='smile', build=(-1, 'mid'),
                    hair=H('black', 'xlong', 'none', part=10, vol=(1, 1), lock=15),
                    top=(206, 64, 68), sleeve='tee', pants=JEANS, extra=['stud_green']),
    'faith':   dict(skin='light', face='soft', eyes='happy', brows='arched', mouth='grin', rosy=True, build=(-1, 'mid'),
                    hair=H('black', 'long', 'side', part=6, texture='wavy', vol=(2, 2)),
                    top=(154, 198, 234), sleeve='long', pants=GREY, extra=['scarf']),
    'jesse':   dict(skin='pale', face='long', eyes='round', iris=HAZEL_EYE, brows='flat', mouth='smile', build=(2, 'slim'),
                    hair=H('rust', 'short', 'short', texture='curly', vol=(2, 4)),
                    top=(46, 46, 56), sleeve='tee', pants=KHAKI, glasses='round', frame=(176, 166, 158)),
    'khoi':    dict(skin='light', face='oval', eyes='dot', brows='flat', mouth='smirk', build=(0, 'mid'),
                    hair=H('black', 'ear', 'split', part=10, vol=(2, 2)),
                    top=(144, 146, 156), jacket=(98, 108, 78), sleeve='long', pants=DARK, glasses='rim', frame=(48, 42, 62)),
    'minnie':  dict(skin='fair', face='slim', eyes='big', iris=DARK_EYE, brows='thin', mouth='smile', build=(0, 'slim'),
                    hair=H('black', 'long', 'curtain', vol=(1, 2)),
                    top=(46, 44, 58), sleeve='long', pants=GREY, extra=['cross']),
    'nikka':   dict(skin='fair', face='round', eyes='round', brows='arched', mouth='grin', freckles=True, build=(-1, 'mid'),
                    hair=H('red', 'chin', 'curtain', texture='curly', vol=(3, 2)),
                    top=(56, 108, 208), sleeve='tee', pants=DARK, glasses='round', frame=(176, 154, 124), extra=['jersey']),
    'patrick': dict(skin='fair', face='square', eyes='round', iris=BLUE_EYE, brows='flat', mouth='grin', build=(2, 'broad'),
                    hair=H('lbrown', 'short', 'side', part=6, vol=(1, 2), lock=7),
                    top=NAVY, sleeve='long', pants=KHAKI, glasses='rim', frame=(48, 42, 62), extra=['beard']),
    'shengen': dict(skin='light', face='round', eyes='dot', brows='thin', mouth='small', build=(-1, 'slim'),
                    hair=H('black', 'ear', 'wispy', vol=(1, 2), pigtails=True),
                    top=(240, 238, 230), jacket=(244, 160, 190), sleeve='long', pants=JEANS, glasses='round', frame=(196, 164, 120)),
    'zia':     dict(skin='fair', face='oval', eyes='happy', brows='arched', mouth='grin', build=(0, 'mid'),
                    hair=H('brown', 'long', 'none', part=11, vol=(2, 2), streaks=(206, 160, 104), ends=(200, 154, 100)),
                    top=(46, 44, 58), sleeve='tee', pants=JEANS),
    'belinda': dict(skin='fair', face='heart', eyes='happy', brows='arched', mouth='grin', build=(-1, 'mid'),
                    hair=H('dark', 'chin', 'side', part=7, texture='curly', vol=(3, 3)),
                    top=NAVY, sleeve='long', pants=DARK, extra=['hoops', 'lanyard']),
    'vivian':  dict(skin='light', face='round', eyes='round', brows='flat', mouth='small', build=(-1, 'slim'),
                    hair=H('black', 'shoulder', 'full'),
                    top=(74, 164, 100), sleeve='tee', pants=KHAKI, glasses='rim', frame=(60, 54, 68)),
    'nika':    dict(skin='fair', face='square', eyes='narrow', iris=DARK_EYE, brows='angled', mouth='smirk', build=(1, 'broad'),
                    hair=H('dark', 'short', 'peak', vol=(1, 1), lock=7),
                    top=(206, 64, 68), sleeve='tank', pants=DARK, extra=['moustache']),
    'tekla':   dict(skin='pale', face='soft', eyes='round', iris=BLUE_EYE, brows='arched', mouth='grin', rosy=True, build=(0, 'broad'),
                    hair=H('strawberry', 'shoulder', 'none', part=9, texture='wavy', vol=(2, 2)),
                    top=(238, 226, 200), sleeve='long', pants=JEANS),
    'peilin':  dict(skin='light', face='slim', eyes='round', lash=True, brows='thin', mouth='smile', build=(0, 'slim'),
                    hair=H('darkbrown', 'long', 'curtain', vol=(2, 2)),
                    top=(100, 144, 208), stripe=(228, 234, 246), sleeve='long', pants=JEANS, extra=['shades_up']),
}

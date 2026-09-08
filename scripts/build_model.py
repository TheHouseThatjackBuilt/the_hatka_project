"""Parametric reconstruction of the supplied photographed apartment plan.
Units: metres. X follows the plan rightwards; Y is height; Z follows plan downwards.
Run with Python 3 (standard library only). Exports JSON, GLB, OBJ and MTL
to public/models/apartment, or to the directory passed with --output-dir.
"""
from pathlib import Path
import argparse
import copy
import json
import math
import struct

DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / 'public' / 'models' / 'apartment'
H = 2.7
PARTS = []
MATS = {
    'wall': ('Warm plaster', '#eeeae2', 1),
    'slab': ('Concrete slab', '#aaa59b', 1),
    'oak': ('Natural oak', '#bba081', 1),
    'oak_light': ('Oak front', '#cfb99a', 1),
    'floor': ('Oak flooring', '#d5bea0', 1),
    'joint': ('Floor joints', '#bca58b', 1),
    'tile': ('Warm grey tile', '#c5c5bc', 1),
    'tilejoint': ('Tile grout', '#aeafa7', 1),
    'white': ('Porcelain and painted joinery', '#f5f2ea', 1),
    'stone': ('Pale stone worktop', '#e0dfd5', 1),
    'dark': ('Graphite metal', '#41464a', 1),
    'black': ('Appliance glass', '#252c30', 1),
    'linen': ('Ivory upholstery', '#e4ded0', 1),
    'sage': ('Sage upholstery', '#9da993', 1),
    'terra': ('Clay textile', '#b47e66', 1),
    'glass': ('Window glass', '#a9c4ca', .24),
    'showerglass': ('Shower glass', '#b8d1d1', .18),
    'mirror': ('Mirror', '#b8c7c6', .75),
    'green': ('Leaves', '#658463', 1),
    'rug': ('Woven rug', '#d6ccba', 1),
}

def add(name, shape, pos, size, mat, group='furniture', rot=0):
    assert min(size) > 0, (name,size)
    PARTS.append(dict(name=name, shape=shape, pos=[round(v,5) for v in pos],
        size=[round(v,5) for v in size], mat=mat, group=group, rot=round(rot,6)))

def box(name,x,z,w,d,h,mat='wall',base=0,group='furniture',rot=0):
    add(name,'box',(x+w/2,base+h/2,z+d/2),(w,h,d),mat,group,rot)

def cyl(name,x,z,r,h,mat='oak',base=0,group='furniture'):
    add(name,'cylinder',(x,base+h/2,z),(r*2,h,r*2),mat,group)

def ell(name,x,z,w,d,h,mat='linen',base=0,rot=0,group='furniture'):
    add(name,'sphere',(x,base+h/2,z),(w,h,d),mat,group,rot)

def rotate_parts(first_part,x,z,rot):
    """Rotate a newly assembled fixture as a unit around its plan anchor."""
    if not rot:
        return
    ca,sa = math.cos(rot),math.sin(rot)
    for part in PARTS[first_part:]:
        dx,dz = part['pos'][0]-x,part['pos'][2]-z
        part['pos'][0] = round(x+ca*dx+sa*dz,5)
        part['pos'][2] = round(z-sa*dx+ca*dz,5)
        part['rot'] = round(part['rot']+rot,6)

def wall(name,x,z,w,d,base=0,h=H):
    box(name,x,z,w,d,h,'wall',base,'walls')

def cabinet(name,x,z,w,d,h=2.55,mat='oak_light',front='south',base=0):
    box(name,x,z,w,d,h,mat,base)
    n=max(1,round(w/.55)) if front in ['south','north'] else max(1,round(d/.55))
    for i in range(n):
        if front in ['south','north']:
            fx=x+i*w/n+.015; fz=z+d if front=='south' else z-.018
            box(name+' / door '+str(i+1),fx,fz,w/n-.03,.018,h-.05,'white',base+.025)
            box(name+' / pull '+str(i+1),fx+w/n-.09,fz-.014 if front=='north' else fz+.018,.015,.026,.18,'dark',base+h*.48)
        else:
            fx=x+w if front=='east' else x-.018; fz=z+i*d/n+.015
            box(name+' / door '+str(i+1),fx,fz,.018,d/n-.03,h-.05,'white',base+.025)

def opening_wall(name,x,z,w,d,axis,lo,hi,sill=0,head=2.1,window=False):
    """lo/hi measured along the wall's long axis, relative to its start."""
    length=w if axis=='x' else d
    if axis=='x':
        if lo>0:wall(name+' left',x,z,lo,d)
        if hi<length:wall(name+' right',x+hi,z,length-hi,d)
        if sill:wall(name+' sill',x+lo,z,hi-lo,d,h=sill)
        wall(name+' lintel',x+lo,z,hi-lo,d,head,H-head)
    else:
        if lo>0:wall(name+' upper',x,z,w,lo)
        if hi<length:wall(name+' lower',x,z+hi,w,length-hi)
        if sill:wall(name+' sill',x,z+lo,w,hi-lo,h=sill)
        wall(name+' lintel',x,z+lo,w,hi-lo,head,H-head)
    if window:
        if axis=='x':window_x(name,x+lo,x+hi,z+d/2,sill,head)
        else:window_z(name,x+w/2,z+lo,z+hi,sill,head)

def window_x(name,a,b,z,sill=.85,head=2.35):
    for x in [a,b-.05]:box(name+' jamb',x,z-.045,.05,.09,head-sill,'white',sill,'windows')
    for h in [sill,head-.05]:box(name+' rail',a,z-.045,b-a,.09,.05,'white',h,'windows')
    n=max(2,round((b-a)/.65))
    for i in range(1,n):box(name+' mullion',a+(b-a)*i/n-.025,z-.035,.05,.07,head-sill,'white',sill,'windows')
    box(name+' glazing',a+.03,z-.008,b-a-.06,.016,head-sill-.06,'glass',sill+.03,'windows')
    box(name+' ledge',a-.04,z-.17,b-a+.08,.30,.04,'stone',sill-.04,'windows')

def window_z(name,x,a,b,sill=.85,head=2.35):
    for z in [a,b-.05]:box(name+' jamb',x-.045,z,.09,.05,head-sill,'white',sill,'windows')
    for h in [sill,head-.05]:box(name+' rail',x-.045,a,.09,b-a,.05,'white',h,'windows')
    n=max(2,round((b-a)/.65))
    for i in range(1,n):box(name+' mullion',x-.035,a+(b-a)*i/n-.025,.07,.05,head-sill,'white',sill,'windows')
    box(name+' glazing',x-.008,a+.03,.016,b-a-.06,head-sill-.06,'glass',sill+.03,'windows')

def door(name,x,z,width,angle,sliding=False):
    # Slab centre from hinge at (x,z), measured in the plan's X/Z plane.
    a=math.radians(angle)
    add(name,'box',(x+math.cos(a)*width/2,1.045,z+math.sin(a)*width/2),(width,2.09,.04),'oak_light','doors',-a)
    if not sliding:
        cyl(name+' hinge',x,z,.017,2.07,'dark',.01,'doors')

def chair(name,x,z,angle=0):
    ell(name+' seat',x,z,.45,.44,.11,'sage',.41,rot=angle)
    # Rotated local rear point.
    bx=x-math.sin(angle)*.19; bz=z-math.cos(angle)*.19
    add(name+' back','box',(bx,.66,bz),(.44,.4,.065),'sage','furniture',angle)
    for dx in [-.15,.15]:
        for dz in [-.15,.15]:
            lx=x+dx*math.cos(angle)+dz*math.sin(angle)
            lz=z-dx*math.sin(angle)+dz*math.cos(angle)
            cyl(name+' leg',lx,lz,.017,.42,'oak',0)

def walk_in_shower(name,x,z,w,d):
    """Wall-to-wall shower; entry slides along the west partition at its north end."""
    box(name+' tray',x,z,w,d,.04,'stone',.02)
    box(name+' tiled floor',x+.025,z+.02,w-.05,d-.04,.012,'tile',.06)
    box(name+' linear drain',x+w-.085,z+.12,.035,d-.24,.006,'dark',.073)
    box(name+' east wall tile',x+w-.018,z,.018,d,2.20,'tile',.02)
    for tile_z in [z+.58,z+1.16]:
        box(name+' wall grout',x+w-.021,tile_z,.003,.004,2.20,'tilejoint',.02)
    box(name+' fixed glass',x+.022,z+.70,.012,d-.72,2.05,'showerglass',.075)
    box(name+' sliding glass door',x+.05,z+.02,.012,.72,2.05,'showerglass',.075)
    for rail_base in [.065,2.125]:
        box(name+' sliding rail',x+.015,z+.015,.055,d-.03,.022,'dark',rail_base)
    for post_z in [z+.02,z+d-.04]:
        box(name+' end post',x+.022,post_z,.022,.02,2.05,'dark',.075)
    box(name+' door handle',x+.018,z+.12,.024,.018,.28,'dark',.84)
    cyl(name+' riser',x+w-.075,z+d*.60,.014,1.12,'dark',1.01)
    box(name+' mixer',x+w-.12,z+d*.60-.10,.055,.20,.05,'dark',.98)
    box(name+' rain arm',x+w-.34,z+d*.60-.014,.28,.028,.026,'dark',2.11)
    cyl(name+' rain head',x+w-.34,z+d*.60,.13,.025,'dark',2.085)

def toilet(name,x,z):
    box(name+' cistern wall',x-.30,z+.24,.60,.16,1.10,'white')
    ell(name+' bowl',x,z,.37,.58,.30,'white',.16)
    ell(name+' seat',x,z-.04,.38,.47,.045,'white',.44)
    ell(name+' opening',x,z-.055,.245,.33,.015,'dark',.468)
    box(name+' flush',x-.085,z+.228,.17,.016,.085,'dark',.91)

def bathtub(name,x,z,w=1.70,d=.70,h=.60):
    """Open bath with a recessed floor, four sides and an overhanging rim."""
    box(name+' base',x,z,w,d,.12,'white',.04)
    box(name+' back',x,z,w,.075,h-.16,'white',.16)
    box(name+' apron',x,z+d-.075,w,.075,h-.16,'white',.16)
    for suffix,side_x in [('left end',x),('right end',x+w-.10)]:
        box(name+' '+suffix,side_x,z+.075,.10,d-.15,h-.16,'white',.16)
    box(name+' recessed floor',x+.10,z+.075,w-.20,d-.15,.025,'white',.16)
    for suffix,rim_z in [('back rim',z),('front rim',z+d-.105)]:
        box(name+' '+suffix,x,rim_z,w,.105,.025,'white',h-.01)
    for suffix,rim_x in [('left rim',x),('right rim',x+w-.15)]:
        box(name+' '+suffix,rim_x,z+.105,.15,d-.21,.025,'white',h-.01)
    cyl(name+' drain',x+w-.28,z+d/2,.026,.006,'dark',.186)
    box(name+' overflow',x+w-.108,z+d/2-.055,.012,.11,.035,'dark',h-.14)
    cyl(name+' mixer',x+w-.28,z+.04,.022,.16,'dark',h+.015)
    box(name+' spout',x+w-.298,z+.025,.036,.22,.025,'dark',h+.15)
    cyl(name+' spout outlet',x+w-.28,z+.23,.021,.035,'dark',h+.12)


def basin(name,x,z,w=.5,d=.42,base=.84,rot=0):
    first_part = len(PARTS)
    ell(name+' rim',x,z,w,d,.095,'white',base)
    ell(name+' bowl',x,z-.016,w*.69,d*.64,.013,'tile',base+.078)
    cyl(name+' tap',x,z+d*.44,.015,.19,'dark',base)
    box(name+' spout',x-.014,z+d*.18,.028,d*.29,.025,'dark',base+.165)
    rotate_parts(first_part,x,z,rot)

def pc_setup(name,x,z,rot=0):
    """Monitor-centred workstation, facing north before rotation."""
    first_part = len(PARTS)
    box(name+' monitor base',x-.11,z-.10,.22,.20,.015,'dark',.782)
    box(name+' monitor stand',x-.018,z-.015,.036,.035,.14,'dark',.797)
    box(name+' monitor bezel',x-.32,z-.025,.64,.05,.38,'black',.88)
    box(name+' monitor screen',x-.295,z-.032,.59,.010,.33,'dark',.905)
    # A quiet desktop on each screen, visible from the seated side.
    box(name+' screen window',x-.265,z-.039,.36,.006,.25,'sage',.94)
    for row in range(3):
        box(name+' screen line '+str(row+1),x-.235,z-.043,.22-row*.035,.004,.012,'linen',1.13-row*.045)
    box(name+' keyboard',x-.225,z-.40,.45,.15,.02,'dark',.79)
    for row in range(3):
        for col in range(9):
            box(name+' key %s-%s'%(row+1,col+1),x-.214+col*.047,z-.388+row*.038,.037,.027,.006,'tile',.81)
    box(name+' mouse mat',x+.27,z-.45,.20,.25,.006,'linen',.79)
    ell(name+' mouse',x+.36,z-.34,.065,.115,.035,'dark',.796)
    box(name+' tower',x+.36,z-.28,.22,.40,.55,'dark',.04)
    box(name+' tower front',x+.375,z-.29,.19,.012,.51,'black',.06)
    for fan_base in [.13,.32]:
        ell(name+' tower fan',x+.47,z-.296,.115,.008,.115,'sage',fan_base)
    cyl(name+' tower power light',x+.54,z-.20,.006,.003,'sage',.591)
    rotate_parts(first_part,x,z,rot)

def office_chair(name,x,z,rot=0):
    """Padded swivel chair facing south, with a five-spoke wheeled base."""
    first_part = len(PARTS)
    ell(name+' seat',x,z,.50,.49,.10,'sage',.43)
    box(name+' back frame',x-.225,z-.235,.45,.055,.52,'dark',.52)
    box(name+' back cushion',x-.21,z-.185,.42,.055,.46,'sage',.56)
    for arm_x in [x-.28,x+.245]:
        box(name+' arm support',arm_x,z-.05,.025,.04,.19,'dark',.46)
        box(name+' armrest',arm_x-.007,z-.18,.045,.36,.04,'dark',.65)
    cyl(name+' pedestal',x,z,.035,.34,'dark',.10)
    for i in range(5):
        angle=i*math.tau/5
        dx,dz=math.cos(angle),math.sin(angle)
        add(name+' base spoke','box',(x+dx*.13,.115,z+dz*.13),(.29,.025,.028),'dark',rot=-angle)
        ell(name+' caster',x+dx*.26,z+dz*.26,.075,.06,.065,'black',.03,rot=-angle)
    rotate_parts(first_part,x,z,rot)

def niche_bookcase(name,x,z,w,d):
    """Open shelves facing west, framing one end of the window seat."""
    box(name+' back',x+w-.018,z,.018,d,2.61,'oak_light',.025)
    for side_z in [z,z+d-.025]:
        box(name+' side',x,side_z,w,.025,2.61,'oak_light',.025)
    for level,base in enumerate([.08,.48,.92,1.36,1.80,2.24,2.61]):
        box(name+' shelf '+str(level+1),x,z,w,d,.025,'oak_light',base)
        if level==6:
            continue
        for book in range(4):
            box(name+' book %s-%s'%(level+1,book+1),x+.035,z+.06+book*.062,.23,.045,.20+.025*((level+book)%3),
                ['linen','sage','terra'][(level+book)%3],base+.025)

def plant(name,x,z,r=.15,base=0,height=.65):
    cyl(name+' pot',x,z,r,.25,'terra',base)
    for i in range(5):
        a=i*math.tau/5
        ell(name+' leaf',x+math.cos(a)*r*.6,z+math.sin(a)*r*.6,r*1.2,r*.7,height*.55,'green',base+.23+height*.10*(i%2),rot=a)

# Floor footprint: the entrance extension and the right balcony are explicit.
for name,x,z,w,d in [
    ('Main floor slab',-.24,-.24,10.472,7.30),
    ('Entrance extension slab',-.24,7.06,3.635,1.20),
    ('Entrance corner slab',-.24,6.82,3.635,.24),
    ('Balcony slab',10.232,4.02,1.0,2.58)]:
    box(name,x,z,w,d,.18,'slab',-.18,'floor')
box('Timber floor main',0,0,9.982,6.82,.018,'floor',0,'floor')
box('Timber floor entrance',0,6.82,3.155,1.20,.018,'floor',0,'floor')
box('Balcony surface',10.232,4.02,1.0,2.58,.025,'tile',0,'floor')
for name,x,z,w,d in [('Bathroom 1',0,3.15,1.835,2.49),('Bathroom 2',5.004,5.08,1.58,1.74),('Entrance tile',1.955,5.76,1.20,2.26)]:
    box(name+' floor',x,z,w,d,.019,'tile',.003,'floor')
    for i in range(1,int(w/.6)+1):box(name+' grout',x+i*.6,z,.006,d,.003,'tilejoint',.022,'floor')
    for i in range(1,int(d/.6)+1):box(name+' grout',x,z+i*.6,w,.006,.003,'tilejoint',.022,'floor')
for i in range(1,35):
    x=i*.285
    if x<9.98:box('Timber longitudinal joint',x,0,.005,6.82,.002,'joint',.018,'floor')
    for j in range(1,5):
        z=j*1.65+(i%3)*.38
        if z<6.82:box('Timber board end',x-.28,z,.28,.004,.002,'joint',.018,'floor')

# External north wall; three window sets as shown in the plan.
north_segments=[(-.24,.58),(.58,2.46),(2.46,3.51),(3.51,5.11),(5.11,7.09),(7.09,8.68),(8.68,10.232)]
for i,(a,b) in enumerate(north_segments):
    if i in [1,3,5]:
        wall('North window sill '+str(i),a,-.24,b-a,.24,h=.85)
        wall('North window lintel '+str(i),a,-.24,b-a,.24,2.35,.35)
        window_x('North window '+str(i),a,b,-.12)
    else:wall('North exterior '+str(i),a,-.24,b-a,.24)
wall('West exterior',-.24,0,.24,8.02)
opening_wall('East study wall',9.982,0,.25,3.43,'z',.52,2.64,.85,2.35,True)
opening_wall('East bedroom wall',9.982,3.43,.25,3.39,'z',1.47,2.42,0,2.20,False)
window_z('Balcony door glazing',10.105,4.90,5.85,.10,2.18)
door('Balcony door open',9.99,4.90,.91,180)
wall('South main exterior',3.155,6.82,7.077,.24)
wall('Entrance east exterior',3.155,6.82,.24,1.44)
wall('South cloakroom exterior',-.24,8.02,2.195,.24)
opening_wall('Entrance door wall',1.955,8.02,1.2,.24,'x',.05,1.03,0,2.10)
door('Entry door open',2.985,8.145,.98,95)
# Balcony railing: height inferred, envelope taken from the drawn appendage.
box('Balcony railing east',11.20,4.02,.035,2.58,1.05,'dark',0,'balcony')
for z in [4.02,6.565]:box('Balcony railing return',10.232,z,1.0,.035,1.05,'glass',0,'balcony')
box('Balcony glass guard',11.18,4.06,.018,2.50,.92,'glass',.04,'balcony')

# Interior walls and exact readable control widths.
wall('Living room pier / x=3.122',3.122,0,.24,1.12)
opening_wall('Study partition with door',6.554,0,.15,3.18,'z',.08,1.00,0,2.10)
door('Study door open',6.629,.08,.92,180)
wall('Kitchen and bedroom transverse wall',3.122,3.18,6.86,.25)
wall('Kitchen west return',3.122,2.39,.24,2.31)
wall('Hall storage return',3.122,4.70,.58,.15)
wall('Hall storage east cheek',3.58,3.43,.12,1.42)
wall('Bedroom entrance upper pier',6.554,3.43,.15,.65)
wall('Bedroom ensuite partition',6.584,4.98,.12,1.84)
wall('Bedroom door lintel',6.584,4.08,.12,.9,2.10,.6)
door('Bedroom sliding leaf open',6.722,5.82,.9,-90,True)
wall('Bathroom 1 north wall',0,3.03,1.955,.12)
opening_wall('Bathroom 1 east wall',1.835,3.15,.12,2.49,'z',.70,1.50,0,2.10)
door('Bathroom 1 door open',1.895,4.65,.80,0)
wall('Bathroom 1 south wall',0,5.64,1.955,.12)
wall('Cloakroom east upper',1.835,5.76,.12,1.10)
wall('Cloakroom east lower',1.835,7.66,.12,.36)
wall('Cloakroom door lintel',1.835,6.86,.12,.8,2.10,.6)
door('Cloakroom door open',1.895,7.66,.8,180)
wall('Ensuite west wall',4.884,5.08,.12,1.74)
opening_wall('Ensuite north wall',4.884,4.96,1.82,.12,'x',.12,.92,0,2.10)
door('Ensuite door open',5.004,5.02,.8,-90)
wall('Utility south nib',3.155,6.18,1.729,.12)

# Living room. Footprint calibrated by 3122 mm pier distance and 1150 mm sofa depth.
box('Sofa plinth',.09,.075,2.97,1.10,.19,'oak',.04)
box('Sofa base',.06,.025,3.00,1.15,.29,'linen',.19)
for x in [.06,2.90]:box('Sofa arm',x,.04,.16,1.10,.56,'linen',.2)
for i in range(2):
    x=.235+i*1.325
    box('Sofa seat '+str(i+1),x,.28,1.29,.81,.16,'linen',.47)
    box('Sofa back cushion '+str(i+1),x,.075,1.29,.22,.46,'linen',.53)
ell('Sofa sage pillow',.77,.51,.60,.44,.16,'sage',.64,rot=.36)
ell('Sofa clay pillow',.46,.58,.43,.40,.14,'terra',.65,rot=-.18)
cabinet('TV console 1935 x 400',0,2.63,1.935,.4,.38,'oak_light')
box('Projector screen housing',.03,3.006,1.87,.045,.075,'white',2.50)
box('Projector screen',.045,2.998,1.84,.018,1.08,'white',1.39)

# Round table 900 mm and three chairs.
cyl('Dining tabletop D900',4.46,.60,.45,.045,'oak_light',.735)
cyl('Dining central leg',4.46,.60,.072,.715,'oak',.02)
cyl('Dining base',4.46,.60,.30,.025,'oak',.02)
chair('Dining chair west',3.83,.60,-math.pi/2)
chair('Dining chair east',5.09,.60,math.pi/2)
chair('Dining chair south',4.46,1.27,math.pi)

# L-shaped kitchen: 600 + 600 + 600 + 674, then a 720 mm deep tall return.
for i,(x,w) in enumerate([(3.36,.6),(3.96,.6),(4.56,.6),(5.16,.674)]):
    cabinet('Kitchen base '+str(i+1),x,2.46,w,.72,.86,'oak_light','north')
box('Kitchen worktop',3.345,2.445,2.505,.75,.035,'stone',.86)
# Leave 100 mm of worktop between the sink rim and the west return wall.
sink_x=3.462
box('Kitchen sink outline',sink_x,2.505,.50,.43,.018,'dark',.899)
box('Kitchen sink bowl',sink_x+.045,2.545,.41,.33,.02,'tile',.902)
cyl('Kitchen mixer',sink_x+.23,2.97,.015,.25,'dark',.90)
box('Kitchen mixer spout',sink_x+.216,2.82,.028,.16,.022,'dark',1.13)
box('Induction hob',5.20,2.53,.58,.48,.022,'black',.9)
for x,z,r in [(5.34,2.67,.085),(5.64,2.67,.065),(5.36,2.86,.065),(5.62,2.85,.085)]:cyl('Hob cooking zone',x,z,r,.006,'dark',.924)
cabinet('Kitchen corner return',5.834,2.46,.72,.72,.86,'oak_light','west')
box('Kitchen return worktop',5.819,1.84,.75,1.35,.035,'stone',.86)
cabinet('Kitchen return base 600',5.834,1.84,.72,.60,.86,'oak_light','west')
cabinet('Refrigerator 720 x 700',5.834,1.14,.72,.70,2.20,'white','west')
box('Refrigerator handle',5.797,1.68,.028,.018,.62,'dark',.93)
for i in range(4):cabinet('Kitchen wall cabinet '+str(i+1),3.36+i*.615,2.875,.60,.305,.85,'white','north',1.75)

# Study: a continuous 700 mm deep L-desk with two independent PC stations.
# The west leg starts beyond the door; the south leg ends at the window niche.
box('Study L desk west worktop',6.724,1.08,.70,1.38,.045,'oak_light',.735)
box('Study L desk south worktop',6.724,2.46,2.38,.70,.045,'oak_light',.735)
cabinet('Study desk drawer unit',6.75,1.10,.64,.35,.68,'oak_light','east',.03)
for leg_x,leg_z in [(6.75,2.99),(7.34,3.08),(9.025,2.49),(9.025,3.08)]:
    box('Study desk steel leg',leg_x,leg_z,.045,.045,.715,'dark',.02)
box('Study desk west cable tray',6.78,1.46,.12,1.50,.06,'dark',.63)
box('Study desk south cable tray',7.42,3.02,1.58,.12,.06,'dark',.63)
pc_setup('Study PC 1',6.94,1.75,rot=-math.pi/2)
pc_setup('Study PC 2',8.45,2.98)
office_chair('Study office chair 1',7.80,1.58,rot=-math.pi/2)

# Window-height daybed: a 2000 x 740 mm cushion and storage underneath.
box('Study window seat plinth',9.18,.56,.72,2.04,.08,'oak',.02)
cabinet('Study window seat storage',9.142,.535,.81,2.09,.63,'oak_light','west',.10)
box('Study window seat platform',9.102,.51,.86,2.14,.035,'oak_light',.73)
box('Study window seat cushion',9.152,.57,.74,2.00,.07,'linen',.765)
ell('Study window seat pillow north',9.50,.84,.60,.42,.16,'sage',.835,rot=.10)
ell('Study window seat pillow clay',9.54,1.10,.50,.30,.12,'terra',.835,rot=-.12)
box('Study window seat folded throw',9.17,2.15,.70,.32,.025,'sage',.838)
niche_bookcase('Study niche north bookcase',9.122,.025,.84,.455)
niche_bookcase('Study niche south bookcase',9.122,2.70,.84,.46)

# The shallower overhead bridge clears the window head at 2350 mm.
box('Study niche bridge bottom',9.542,.48,.42,2.22,.035,'oak_light',2.38)
box('Study niche bridge top',9.542,.48,.42,2.22,.035,'oak_light',2.60)
box('Study niche bridge back',9.944,.48,.018,2.22,.22,'oak_light',2.415)
for divider_z in [.48,1.20,1.92,2.675]:
    box('Study niche bridge divider',9.542,divider_z,.42,.025,.185,'oak_light',2.415)
for cubby_z in [.58,1.30,2.02]:
    for book in range(5):
        box('Study niche bridge book',9.57,cubby_z+book*.065,.22,.048,.15+.01*(book%3),
            ['sage','linen','terra'][book%3],2.415)
box('Study plant wall backing',6.714,1.14,.035,.30,1.20,'oak',1.03)
for k in range(5):ell('Study plant wall foliage',6.77,1.28,.10,.28,.25,'green',1.07+k*.22)

# Hallway storage 2866 x 650 and utility block.
cabinet('Hall wardrobe 2866 x 650',3.70,3.43,2.866,.65,2.55,'oak_light','south')
cabinet('Hall shallow cupboard',3.36,3.45,.22,1.25,2.55,'white','west')
cabinet('Utility base cupboard 882',3.36,5.53,.882,.55,.89,'oak_light','north')
cabinet('Laundry utility housing 650',4.242,5.53,.642,.65,2.50,'white','north')
for base,name in [(.08,'Washing machine'),(.96,'Tumble dryer')]:
    box(name,4.267,5.52,.58,.50,.80,'white',base)
    # Face circles are ellipsoids facing -Z.
    ell(name+' door',4.557,5.508,.36,.028,.36,'dark',base+.21)
    ell(name+' glass',4.557,5.485,.275,.018,.275,'mirror',base+.2525)
box('Utility worktop',3.35,5.51,.90,.59,.035,'stone',.89)
basin('Utility basin',4.54,6.43,.34,.25,.83)
cabinet('Hall console',2.805,5.77,.35,.79,.84,'oak_light','west')
box('Entrance bench base',2.805,6.70,.35,.70,.37,'oak',.02)
box('Entrance bench cushion',2.785,6.70,.38,.70,.08,'linen',.39)
box('Entrance full-length mirror',3.128,7.04,.02,.60,1.80,'mirror',.35)

# Main bathroom: bath at the north wall, two west-facing taps, WC in the former shower corner.
# The bath ends at z=3.85, where the east-wall doorway begins.
bathtub('Bathroom 1 bathtub 1700 x 700',.0675,3.15)
cabinet('Bathroom 1 west double vanity',.015,4.025,.50,1.57,.52,'oak_light','east',.29)
box('Bathroom 1 stone top',.005,4.015,.52,1.59,.035,'stone',.81)
for suffix,z in [('north',4.42),('south',5.20)]:
    basin('Bathroom 1 basin '+suffix,.265,z,.55,.40,.85,rot=-math.pi/2)
    box('Cat litter tray under vanity',.05,z-.25,.43,.50,.16,'white',.02)
box('Bathroom 1 west mirror',.012,4.095,.024,1.44,.91,'mirror',1.10)
toilet('Bathroom 1 WC',1.385,5.22)
box('Bathroom 1 installation shelf',.985,5.47,.82,.14,.045,'oak',1.12)

# Private bathroom: 900 x 1740 mm shower along the entire east wall.
toilet('Ensuite WC',5.39,6.33)
walk_in_shower('Ensuite shower 900 x 1740',5.684,5.08,.90,1.74)
box('Ensuite installation shelf',5.015,6.65,.64,.15,.045,'oak',1.12)

# Cloakroom: perimeter storage, a hanging rail and the robot vacuum niche.
cabinet('Cloakroom north storage',.02,5.78,1.79,.40,2.55,'oak_light','south')
cabinet('Cloakroom west storage',.02,6.18,.40,1.28,2.55,'oak_light','east')
cabinet('Cloakroom south storage',.02,7.66,1.79,.34,2.46,'oak_light','north',.19)
box('Cloakroom open rail',.06,6.29,1.66,.027,.027,'dark',1.74)
for i in range(8):box('Cloakroom hanging garment',.14+i*.17,6.25,.08,.39,.86,'linen' if i%2 else 'sage',.87)
cyl('Robot vacuum',1.50,7.74,.16,.085,'dark',.02)

# Main bedroom: clear mattress size 1800 x 2100 as written on plan.
box('Bedroom rug',7.25,4.47,2.29,2.25,.018,'rug',.021)
box('Bed frame',7.36,4.64,1.86,2.16,.28,'oak',.11)
box('Mattress 1800 x 2100',7.39,4.67,1.80,2.10,.24,'linen',.39)
box('Bed headboard south',7.34,6.71,1.90,.075,1.04,'linen',.02)
box('Bed duvet',7.415,4.70,1.75,1.62,.055,'sage',.635)
box('Bed folded cover',7.415,4.83,1.75,.40,.035,'linen',.69)
for x in [7.87,8.68]:ell('Bedroom pillow',x,6.38,.68,.42,.17,'linen',.65)
for x in [6.79,9.30]:
    cabinet('Bedside table 450 x 400',x,6.36,.45,.40,.45,'oak_light','north')
    cyl('Bedside light base',x+.22,6.55,.07,.025,'dark',.45)
    cyl('Bedside light stem',x+.22,6.55,.012,.25,'dark',.475)
    cyl('Bedside light shade',x+.22,6.55,.115,.14,'linen',.66)
cabinet('Bedroom north cabinet 1960',7.704,3.45,1.96,.396,.56,'white','south',.30)
box('Bedroom north shelf',6.72,3.45,3.24,.40,.035,'oak_light',.86)
for z in [4.12,4.54,6.13,6.55]:
    box('Bedroom curtain pleat',9.88,z,.05,.16,2.54,'linen',.08)
box('Plant rack side',9.742,3.48,.028,.32,1.75,'dark')
for base in [.15,.66,1.18]:
    box('Plant rack shelf',9.742,3.48,.24,.36,.022,'oak_light',base)
    plant('Plant rack pot',9.86,3.65,.08,base+.025,.33)

# A separate ceiling group, hidden in the interactive dollhouse but retained in GLB.
box('Ceiling main',0,0,9.982,6.82,.08,'white',H,'ceiling')
box('Ceiling entrance',0,6.82,3.155,1.20,.08,'white',H,'ceiling')

LABELS=[
    ('Кухня-гостиная',3.70,1.85),('Кабинет',8.12,.66),
    ('Спальня',8.35,4.21),('Санузел',.93,4.22),
    ('Санузел',5.65,5.56),('Гардеробная',1.08,7.13),
    ('Прихожая',2.45,6.43),('Холл',4.31,4.76),('Балкон',10.71,5.24)]
model={'metadata':{'title':'Квартира по фотографии планировки','units':'metres','ceilingHeight':H,
    'coordinateSystem':'X right, Y up, Z down the source plan','source':'User-supplied photographed plan',
    'status':'Approximate reconstruction; readable dimensions prioritized; unlabelled values inferred'},
    'materials':MATS,'parts':PARTS,'labels':LABELS}

def geometry(shape):
    v=[]; n=[]; idx=[]
    if shape=='box':
        faces=[([(1,-1,-1),(1,1,-1),(1,1,1),(1,-1,1)],(1,0,0)),
          ([(-1,-1,1),(-1,1,1),(-1,1,-1),(-1,-1,-1)],(-1,0,0)),
          ([(-1,1,-1),(-1,1,1),(1,1,1),(1,1,-1)],(0,1,0)),
          ([(-1,-1,1),(-1,-1,-1),(1,-1,-1),(1,-1,1)],(0,-1,0)),
          ([(1,-1,1),(1,1,1),(-1,1,1),(-1,-1,1)],(0,0,1)),
          ([(-1,-1,-1),(-1,1,-1),(1,1,-1),(1,-1,-1)],(0,0,-1))]
        for points,normal in faces:
            s=len(v);v.extend([tuple(a*.5 for a in p) for p in points]);n.extend([normal]*4);idx.extend([s,s+1,s+2,s,s+2,s+3])
    elif shape=='sphere':
        nx,ny=20,12
        for j in range(ny+1):
            b=j*math.pi/ny
            for i in range(nx+1):
                a=i*math.tau/nx;p=(math.sin(b)*math.cos(a),math.cos(b),math.sin(b)*math.sin(a))
                v.append(tuple(c*.5 for c in p));n.append(p)
        for j in range(ny):
            for i in range(nx):
                a=j*(nx+1)+i;b=a+nx+1;idx.extend([a,b+1,b,a,a+1,b+1])
    else:
        steps=24
        for i in range(steps+1):
            a=i*math.tau/steps;x,z=math.cos(a),math.sin(a)
            for y in [-.5,.5]:v.append((x*.5,y,z*.5));n.append((x,0,z))
        for i in range(steps):
            a=i*2;idx.extend([a,a+1,a+3,a,a+3,a+2])
        for y,sgn in [(-.5,-1),(.5,1)]:
            c=len(v);v.append((0,y,0));n.append((0,sgn,0))
            for i in range(steps):
                a=i*math.tau/steps;v.append((.5*math.cos(a),y,.5*math.sin(a)));n.append((0,sgn,0))
            for i in range(steps):
                a=c+1+i;b=c+1+(i+1)%steps
                idx.extend([c,b,a] if sgn==1 else [c,a,b])
    return v,n,idx

def export_glb(output_dir):
    binary=bytearray(); views=[];accessors=[];meshes=[];nodes=[]
    def accessor(values,fmt,typ,component,target,with_bounds=False):
        while len(binary)%4:binary.append(0)
        flat=[x for row in values for x in row] if isinstance(values[0],tuple) else values
        start=len(binary);binary.extend(struct.pack('<'+fmt*len(flat),*flat))
        views.append({'buffer':0,'byteOffset':start,'byteLength':len(binary)-start,'target':target})
        acc={'bufferView':len(views)-1,'componentType':component,'count':len(values),'type':typ}
        if with_bounds:
            acc['min']=[min(p[i] for p in values) for i in range(3)];acc['max']=[max(p[i] for p in values) for i in range(3)]
        accessors.append(acc);return len(accessors)-1
    prim={}
    for shape in ['box','cylinder','sphere']:
        v,n,ii=geometry(shape)
        prim[shape]=(accessor(v,'f','VEC3',5126,34962,True),accessor(n,'f','VEC3',5126,34962),accessor(ii,'H','SCALAR',5123,34963))
    materials=[]; matids={}
    for key,(name,col,alpha) in MATS.items():
        rgb=[int(col[i:i+2],16)/255 for i in [1,3,5]]
        # glTF baseColorFactor is linear, convert the authored sRGB swatches.
        rgb=[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb]
        mat={'name':name,'pbrMetallicRoughness':{'baseColorFactor':rgb+[alpha],'metallicFactor':.25 if key=='dark' else 0,'roughnessFactor':.18 if key in ['glass','mirror','black'] else .8}}
        if alpha<1:mat.update(alphaMode='BLEND',doubleSided=True)
        matids[key]=len(materials);materials.append(mat)
    meshids={}
    for p in PARTS:
        key=(p['shape'],p['mat'])
        if key not in meshids:
            a,b,c=prim[p['shape']];meshids[key]=len(meshes)
            meshes.append({'name':' / '.join(key),'primitives':[{'attributes':{'POSITION':a,'NORMAL':b},'indices':c,'material':matids[p['mat']]}]})
    groups={}
    for group in ['floor','walls','windows','doors','furniture','balcony','ceiling']:
        groups[group]=len(nodes);nodes.append({'name':group.upper(),'children':[]})
    for p in PARTS:
        a=p['rot']/2
        node={'name':p['name'],'mesh':meshids[(p['shape'],p['mat'])],'translation':p['pos'],'scale':p['size'],
            'rotation':[0,math.sin(a),0,math.cos(a)],'extras':{'category':p['group']}}
        nodes[groups[p['group']]]['children'].append(len(nodes));nodes.append(node)
    active=[v for k,v in groups.items() if k!='ceiling']
    # Independent node trees for the two scenes. Sharing a parent node across
    # scenes can cause importers to move it out of the default scene.
    offset=len(nodes)
    full_nodes=copy.deepcopy(nodes)
    for node in full_nodes:
        if 'children' in node:node['children']=[i+offset for i in node['children']]
    nodes.extend(full_nodes)
    doc={'asset':{'version':'2.0','generator':'Parametric apartment reconstruction','extras':model['metadata']},
      'scene':0,'scenes':[{'name':'Apartment / open ceiling','nodes':active},{'name':'Apartment / complete shell','nodes':[i+offset for i in groups.values()]}],
      'nodes':nodes,'meshes':meshes,'materials':materials,'buffers':[{'byteLength':len(binary)}],
      'bufferViews':views,'accessors':accessors}
    js=json.dumps(doc,ensure_ascii=False,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
    binary+=b'\0'*((-len(binary))%4)
    total=12+8+len(js)+8+len(binary)
    data=struct.pack('<III',0x46546c67,2,total)+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary
    (output_dir/'apartment.glb').write_bytes(data)

def export_obj(output_dir):
    lines=['# Units: metres; Y up. Ceiling omitted for dollhouse view.','mtllib apartment.mtl'];offset=1
    cache={s:geometry(s) for s in ['box','sphere','cylinder']}
    for num,p in enumerate(PARTS):
        if p['group']=='ceiling':continue
        v,_,ii=cache[p['shape']];ca=math.cos(p['rot']);sa=math.sin(p['rot'])
        lines.extend(['o '+str(num)+'_'+p['name'].replace(' ','_'),'usemtl '+p['mat']])
        for a,b,c in v:
            a*=p['size'][0];b*=p['size'][1];c*=p['size'][2]
            lines.append('v %.5f %.5f %.5f'%(p['pos'][0]+ca*a+sa*c,p['pos'][1]+b,p['pos'][2]-sa*a+ca*c))
        for i in range(0,len(ii),3):lines.append('f '+' '.join(str(offset+j) for j in ii[i:i+3]))
        offset+=len(v)
    (output_dir/'apartment.obj').write_text('\n'.join(lines),encoding='utf-8')
    mtl=[]
    for key,(_,col,alpha) in MATS.items():
        rgb=[int(col[i:i+2],16)/255 for i in [1,3,5]]
        mtl.extend(['newmtl '+key,'Kd '+' '.join('%.4f'%c for c in rgb),'d %.3f'%alpha,'Ns 30',''])
    (output_dir/'apartment.mtl').write_text('\n'.join(mtl),encoding='utf-8')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=DEFAULT_OUTPUT,
                        help='Destination for model.json, apartment.glb, apartment.obj and apartment.mtl')
    output_dir = parser.parse_args().output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / 'model.json').write_text(
        json.dumps(model, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    export_glb(output_dir)
    export_obj(output_dir)
    print(json.dumps({
        'parts': len(PARTS), 'height': H,
        'glb_bytes': (output_dir / 'apartment.glb').stat().st_size,
        'output': str(output_dir),
    }, ensure_ascii=False))


if __name__ == '__main__':
    main()

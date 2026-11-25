# Redraws the 16 premium skins over the form of cookie-plain.png. Run from pixel-clicker-vk: python docs/skins-table/draw_skins.py
import math, random, shutil
from PIL import Image
P=Image.open('art/cookie-plain.png').convert('RGBA'); N=74
hx=lambda s:tuple(int(s[i:i+2],16) for i in(1,3,5))
mix=lambda a,b,k:tuple(round(a[i]+(b[i]-a[i])*k) for i in range(3))
COLD,WARM=hx('#1c1a4a'),hx('#fff6d8')
def ramp(h,d=.62,l=.6):
    c=hx(h); return [mix(c,COLD,d),mix(c,COLD,d*.5),c,mix(c,WARM,l*.5),mix(c,WARM,l)]
hxs=lambda s:[hx('#'+x) for x in s.split()]
B=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5]
bay=lambda x,y:(B[(y&3)*4+(x&3)]+.5)/16-.5
def pick(r,v,x,y,dz=.8): return r[max(0,min(len(r)-1,round(v*(len(r)-1)+bay(x,y)*dz)))]
RIM={k:i for i,k in enumerate('12091e 3e1c08 5a2a0e 8c4618 a95a24 ad5f2a c5763a dc9150 f1b472'.split())}
GEM={**dict.fromkeys(['e8384f','9e1630','ff9aa8'],0),**dict.fromkeys(['f6c142','a8700d','fff1b0'],1),**dict.fromkeys(['3bb36a','1d6e3c','9ff0bd'],2),**dict.fromkeys(['3a8ee8','1b4f8f','a8d4ff'],3)}
Z={};gems=[[],[],[],[]];CX,CY=36,36.5
for y in range(N):
    for x in range(N):
        p=P.getpixel((x,y))
        if not p[3]: continue
        h='%02x%02x%02x'%p[:3]; r=math.hypot(x-CX,(y-CY)); a=math.atan2(y-CY,x-CX)
        if h in GEM: z=('gem',GEM[h]); gems[GEM[h]].append((x,y))
        elif h in('fffaf2','ffffff'): z=('ice',0)
        elif h=='12091e': z=('sh',0)
        else: z=('rim',RIM[h])
        Z[x,y]=(z,r,a)
# the dough between the two icing lines is everything the icing shuts off from the rim: grown from the middle radius
body=set();st=[(x,y) for (x,y),(z,r,a) in Z.items() if z[0]=='rim' and 23<r<26.5 and z[1]>=3]
while st:
    q=st.pop()
    if q in body or q not in Z or Z[q][0][0]!='rim' or not 18.5<Z[q][1]<30.5 or Z[q][0][1]<3: continue
    body.add(q); st+=[(q[0]+1,q[1]),(q[0]-1,q[1]),(q[0],q[1]+1),(q[0],q[1]-1)]
def h2(a,b,s=0):
    return (math.sin(a*127.1+b*311.7+s*74.7)*43758.5453)%1
def noise(x,y,f,s=0):
    x/=f;y/=f;i,j=math.floor(x),math.floor(y);u,v=x-i,y-j;u=u*u*(3-2*u);v=v*v*(3-2*v)
    return (h2(i,j,s)*(1-u)+h2(i+1,j,s)*u)*(1-v)+(h2(i,j+1,s)*(1-u)+h2(i+1,j+1,s)*u)*v
def vor(x,y,c,s=0):
    d=[]
    for i in range(int(x//c)-1,int(x//c)+2):
        for j in range(int(y//c)-1,int(y//c)+2):
            d.append((math.hypot((i+h2(i,j,s))*c-x,(j+h2(i,j,s+9))*c-y),h2(i,j,s+3)))
    d.sort(); return d[1][0]-d[0][0],d[0][1]
def lite(x,y,r,a):   # the round of the band, the light from the top left
    across=1-abs(r-24.5)/6; return max(0,min(1,.36+.28*across-.22*math.sin(a+.78+math.pi/2-1.57+1.57)*0+.2*(-(math.cos(a)+math.sin(a))*(r-24.5)/6)+.1*(-(x-CX)-(y-CY))/34))
STAMP={'star':['.x.','xox','.x.'],'flake':['x.x.x','.xxx.','xxoxx','.xxx.','x.x.x'],'flower':['.xx.xx.','xxxxxxx','.xoooox'[:7],'xxooxxx','xxxxxxx','.xx.xx.'],'ros':['..x..','.xxx.','xxoxx','.xxx.','..x..'],'heart':['xx.xx','xxxxx','xxxxx','.xxx.','..x..'],'bat':['x.....x','xx.x.xx','xxxxxxx','.x.x.x.'],'fish':['..xx..x','.xxxxxx','xoxxxx.','.xxxxxx','..xx..x'],'shell':['.xxx.','xoxox','xoxox','.xxx.','..x..'],'ghost':['.xxx.','xxxxx','xoxox','xxxxx','xxxxx','x.x.x'],'dia':['..x..','.xox.','xooox','.xox.','..x..'],'planet':['..xx...','.xooxx.','xoooxxx','.xxxxx.','..xx...'],'egg':['.xx.','xxxx','oooo','xxxx','.xx.'],'spider':['x.x.x','.xxx.','xxoxx','.xxx.','x.x.x'],'crown':['x.x.x','xxxxx','xoxox','xxxxx'],'leaf':['.xx','xxx','xx.'],'dot':['x']}
def make(id,rim,ice,bodyF,stamps=(),rimF=None,sh='#12091e',gemc=('#e8384f','#f6c142','#3bb36a','#3a8ee8'),iceF=None):
    im=Image.new('RGBA',(N,N)); pt=lambda x,y,c:im.putpixel((x,y),tuple(c)+(255,))
    for (x,y),(z,r,a) in Z.items():
        if z[0]=='sh': c=hx(sh)
        elif (x,y) in body: c=bodyF(x,y,r,a,lite(x,y,r,a))
        elif z[0]=='rim':
            v=z[1]/8; edge=any((x+i,y+j) not in Z for i,j in((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1)));c=rimF(x,y,r,a,min(v,.12) if edge and rimF else v) if rimF and (not edge or id in('neontube','rainbow','crystal','newyear')) else None
            if edge: v=min(v,.3)
            if c is None: c=pick(rim,v,x,y,.5)
        elif z[0]=='ice':
            up=Z.get((x,y-1),(('no',0),))[0][0]!='ice';dn=Z.get((x,y+1),(('no',0),))[0][0]!='ice'
            v=1 if up and not dn else .35 if dn and not up else .7
            if h2(x,y)>.9: v-=.25
            c=iceF(x,y,r,a,v) if iceF else pick(ice,v,x,y,.4)
        else: continue
        pt(x,y,c)
    for name,ang,rad,c1,c2 in stamps:
        g=STAMP[name];ox=round(CX+math.cos(math.radians(ang))*rad-len(g[0])/2);oy=round(CY+math.sin(math.radians(ang))*rad-len(g)/2)
        cells=[(ox+i,oy+j,ch) for j,row in enumerate(g) for i,ch in enumerate(row) if ch!='.']
        for x,y,ch in cells:                                   # a cold shadow under the piece
            if (x+1,y+1) in body: pt(x+1,y+1,mix(im.getpixel((x+1,y+1))[:3],COLD,.4))
        top=min(q[1] for q in cells)
        for x,y,ch in cells:
            if (x,y) not in body: continue
            c=hx(c1 if ch=='x' else c2); j=y-top
            c=mix(c,WARM,.35) if j==0 else mix(c,COLD,.28) if j==len(g)-1 else c
            pt(x,y,c)
    for i,g in enumerate(gems):                                # the sweets: five tones, a glint and a light from below
        mx=sum(q[0] for q in g)/len(g);my=sum(q[1] for q in g)/len(g);R=max(math.hypot(x-mx,y-my) for x,y in g);q5=ramp(gemc[i],.6,.75)
        for x,y in g:
            u,w=(x-mx)/R,(y-my)/R;d=1-u*u-w*w; v=.2+.5*max(0,d)+.42*(-u-w)*.55
            if math.hypot(u-.35,w-.45)<.3: v+=.2
            pt(x,y,pick(q5,max(0,min(1,v)),x,y,.25))
        for dx,dy in((-2,-2),(-1,-2),(-2,-1)):
            q=(round(mx+dx),round(my+dy))
            if q in g: pt(*q,(255,255,255) if dx+dy==-4 or dx==-1 else mix(q5[4],(255,255,255),.5))
    for d in('art','phone/art'): im.save(f'{d}/cookie-{id}.png')
T=lambda r:(lambda x,y,ra,a,l:pick(r,l,x,y))
W=hxs('b4a8cc d8d0e4 f2ecf2 fffaf0 ffffff')
# royal: quilted gold with pearls, a purple velvet rim
g=hxs('8a4a12 c07a18 e8ac26 ffd54a fff0a0')
def f(x,y,r,a,l):
    u,v=(x+y)%8,(x-y)%8; return pick(g,l-.26 if u==0 or v==0 else l+.2 if u==1 or v==1 else l,x,y,.6)
make('royal',hxs('1c0838 34105c 4a1a80 5c2596 c08a1c d8a428 f0c43c ffdf66 fff4ae'),hxs('e0b868 f4d890 fff0c4 fffae4 ffffff'),f,[('crown',-60,24.5,'#8a3cc8','#ff5a78'),('dia',185,24.5,'#f4f0ff','#7fd8ff'),('crown',65,24.5,'#8a3cc8','#7dffb0'),('dia',120,24.5,'#ffe9ff','#ff7ac8')],lambda x,y,r,a,v:hx('#f4ecff') if v<.3 and r>33 and int(a*9+60)%3==0 and h2(x,y)>.75 else None)
# ghost: mist with rising wisps and little ghosts
g=hxs('35585c 527c78 78a596 a4ccb4 d4f2dc')
f=lambda x,y,r,a,l:pick(g,l+.38*(noise(x+4*math.sin(y*.3),y,6,2)-.5),x,y,1)
make('ghost',hxs('16303a 234650 336060 477a74 5f9488 78aa9a 92c0ac b4dac4 dcf8e6'),hxs('8cc8b8 b4e4d0 d8fae8 f0fff8 ffffff'),f,[('ghost',-50,24.5,'#f0fff6','#1c4048'),('ghost',180,24.5,'#e4fff0','#1c4048'),('ghost',66,24.5,'#f0fff6','#1c4048'),('star',-122,24.5,'#ffffff','#ffffff')],gemc=('#e85a7a','#e8c860','#4cc08a','#5aa0e8'))
# neon tube: a dark plate with circuit lines, glowing tubes
g=hxs('07050f 120d20 1d1533 2c2050 43307a')
def f(x,y,r,a,l):
    if (x*2+y)%11==0 and y%4<3: return mix(hx('#12324c'),hx('#22c8e0'),l*.8)
    if (x-y*2)%13==0: return mix(hx('#34103e'),hx('#ff3cc8'),l*.6)
    return pick(g,l+.1,x,y)
def rm(x,y,r,a,v):
    k=.5+.5*math.sin(a*2+.6);col=mix(hx('#00f0e6'),hx('#ff3cc8'),max(0,min(1,round(k*4)/4)))
    return mix(mix(hx('#0a0618'),col,.35+v*.65) if v>.15 else hx('#0a0618'),(255,255,255),max(0,v-.75)*2.6)
def ic(x,y,r,a,v):
    k=round((.5+.5*math.sin(a*2+3.6))*4)/4;return mix((255,255,255),mix(hx('#7df9ff'),hx('#ff8ae4'),k),.75-v*.65)
make('neontube',g,W,f,[('dot',-70,24,'#7df9ff','#fff000'),('star',-52,24.5,'#ffe94a','#ffffff'),('star',178,24.5,'#7dff9a','#ffffff'),('star',64,24.5,'#ff8ae4','#ffffff')],rm,iceF=ic)
# crystal: cut facets
g=hxs('2c5490 4a82bc 78b2dc aee0f4 eefcff')
def f(x,y,r,a,l):
    d,k=vor(x,y,6,4); return hx('#f4ffff') if d<.55 and k>.4 else pick(g,l*.55+k*.5,x,y,.25)
def rm(x,y,r,a,v):
    d,k=vor(x,y,5,7); return pick(hxs('123468 1e4c8a 3068ae 4c8ac8 78b0de a4d2ee cceaf8 eefcff'),v*.8+(k-.5)*.35+.06,x,y,.2)
make('crystal',g,hxs('9cc8e8 c4e4f6 e6f8ff f6ffff ffffff'),f,[('dia',-52,24.5,'#d8f6ff','#ffffff'),('dia',180,24.5,'#c8b8ff','#ffffff'),('dia',66,24.5,'#d8f6ff','#ffffff')],rm)
# volcano: basalt plates, hot lava in the cracks
g=hxs('150a10 25101a 3a1a1c 562a22 78402c')
def f(x,y,r,a,l):
    d,k=vor(x,y,7.5,2); return hx('#ffd35a') if d<.3 else hx('#f0701a') if d<.8 else hx('#8a2414') if d<1.4 else pick(g,l+.15*(k-.5),x,y,.6)
def rm(x,y,r,a,v):
    d,k=vor(x,y,7,5); return hx('#ffb040') if d<.35 and v>.3 else hx('#c8401a') if d<.8 and v>.2 else None
make('volcano',hxs('14080c 220e10 341414 4c1c16 6a2818 84341a a4441c d0601c ff9a3a'),hxs('c8481a f07a20 ffb03c ffd870 fff4b8'),f,(),rm)
# solar: the boiling surface of the sun, a rim of space with the planets
g=hxs('d0561a f0841e ffb02e ffd35a fff4b0')
f=lambda x,y,r,a,l:pick(g,l*.7+.55*noise(x+3*math.sin(y*.5),y+3*math.cos(x*.4),4,1)-.08,x,y,.9)
def rm(x,y,r,a,v):
    if v<.55: return hx('#ffffff') if h2(x,y,4)>.955 else pick(hxs('0c0a2c 181248 2a1e6c 3e2c92'),v/.55,x,y)
    return pick(hxs('f0841e ffa82e ffcc50 fff0a0'),(v-.55)/.45,x,y,.4)
make('solar',hxs('0c0a2c 181248 2a1e6c 3e2c92 d0661e f0941e ffb838 ffd668 fff0a8'),hxs('ffc04a ffdc78 fff0b0 fffadc ffffff'),f,[('planet',-52,24.5,'#c88a4a','#f0d8a0'),('planet',180,24.5,'#3a6ad8','#58d88a'),('planet',66,24.5,'#d8503a','#f09a6a')],rm)
# starry night: brush swirls
g=hxs('0e1238 1a2660 2c4494 4a74c4 8ab0e8')
def f(x,y,r,a,l):
    v=99
    for k,(sx,sy) in enumerate([(10,32),(52,14),(48,62),(24,10),(22,64)]):
        v=min(v,math.hypot(x-sx,y-sy)+math.atan2(y-sy,x-sx)*.8)
    return pick(g,l*.55+.25+.28*math.sin(v*1.35),x,y,.3)
make('starry',hxs('080a20 0e1230 161c48 202a64 303e86 4658a8 6a80cc 98aeea d0dcff'),hxs('7c90d0 a8bcec d0dcfc e8f0ff ffffff'),f,[('ros',-50,24.5,'#ffd84a','#ffffff'),('ros',180,24.5,'#ffe89a','#ffffff'),('ros',66,24.5,'#ffd84a','#ffffff'),('star',110,24,'#fff6c8','#ffffff')],lambda x,y,r,a,v:hx('#e8f0ff') if v<.45 and h2(x,y,8)>.95 else None)
# caramel: glossy, streams and salt
g=hxs('7c3a10 a8581a d4841f f4b03c ffdc84')
def f(x,y,r,a,l):
    if h2(x,y,6)>.965: return hx('#fffaf0')
    s=math.sin(a*7+math.sin(r*.6)*1.3); return pick(g,l+.16*s+(.35 if 26<r<27.3 and s>.1 else 0),x,y,.6)
make('caramel',hxs('34140a 56240c 7c380e a25012 c06a18 d48422 e6a034 f8c050 ffe498'),hxs('d89040 f0b860 ffdc94 fff0c4 ffffff'),f,[('heart',-52,24.5,'#8a3c12','#ffd890'),('heart',180,24.5,'#8a3c12','#ffd890'),('heart',66,24.5,'#8a3c12','#ffd890')],lambda x,y,r,a,v:pick(hxs('a25012 d48422 f8c050 ffe498'),.3+v*.6,x,y) if r>31 and v<.5 and math.sin(a*11)>.35 else None)
# gzhel: porcelain with cobalt flowers, leaves and a border of strokes
g=hxs('a8b8dc c8d6ee e6eef8 f8fbff ffffff')
f=lambda x,y,r,a,l:hx('#5a86d8') if abs(r-24.5-2.2*math.sin(a*6))<.5 else pick(g,l+.35,x,y,.7)
make('gzhel',hxs('0c1c50 142c74 1c3f9c 2c58bc 88a6dc b0c6ec d0def6 eaf2ff ffffff'),hxs('1c3f9c 2c58bc 4474d4 6c98e8 94b8f4'),f,[('flower',-52,24.5,'#1c48b4','#e8f2ff'),('flower',180,24.5,'#1c48b4','#e8f2ff'),('flower',66,24.5,'#1c48b4','#e8f2ff'),('leaf',-72,24,'#3a6cd0','#fff'),('leaf',-32,25,'#3a6cd0','#fff'),('leaf',116,24,'#3a6cd0','#fff'),('leaf',44,25,'#3a6cd0','#fff')],lambda x,y,r,a,v:hx('#f4f8ff') if v<.45 and r>32 and math.sin(a*18)>.55 else None)
# rainbow: stripes along the arch, glossy
import colorsys
def hsl(h,l,s=.68): return tuple(round(v*255) for v in colorsys.hls_to_rgb(h%1,max(0,min(1,l)),s))
def f(x,y,r,a,l):
    k=math.floor((r-19)/10*7); return hsl(k/7.5+.02,.48+round(l*4+bay(x,y)*.6)/4*.34)
def rm(x,y,r,a,v): return mix(hsl(round((a/6.283+.5)*24)/24,(.16+round(v*5)/5*.6),.6),COLD,.18) 
make('rainbow',g,W,f,[('star',-48,24.5,'#ffffff','#fff6a0'),('star',180,24.5,'#ffffff','#fff6a0'),('star',66,24.5,'#ffffff','#fff6a0')],rm)
# neon (space): nebula and stars
def f(x,y,r,a,l):
    if h2(x,y,3)>.955: return (255,255,255)
    n=noise(x,y,9,5);m=noise(x,y,6,8); c=pick(hxs('140a36 2a1462 4a2090 7a34c0 b060e8'),l*.5+m*.55-.05,x,y,.9)
    return mix(c,hx('#ff5fdc') if n>.55 else hx('#3ad0ff'),max(0,abs(n-.5)-.08)*1.5)
make('neon',hxs('10062a 220c4c 3a1474 5a1e9a 8a2cc0 b43cd8 dc50e8 ff7af0 ffc4ff'),hxs('b060e8 e080f8 ffb0ff ffe0ff ffffff'),f,[('planet',-52,24.5,'#ff8ad8','#ffe0f4'),('star',180,24.5,'#7df9ff','#ffffff'),('planet',66,24.5,'#4ad8f0','#d8ffff')],lambda x,y,r,a,v:hx('#ffffff') if v<.4 and h2(x,y,9)>.95 else None)
# sea: water with ripples, fish, shells, foam
g=hxs('0e3c7c 1a62aa 2c8cd0 5cbcec a8ecfc')
def f(x,y,r,a,l):
    s=math.sin(y*1.0+2*math.sin(x*.45)); return pick(g,l+(.3 if s>.82 else -.12 if s<-.7 else 0),x,y,.6)
make('sea',hxs('0a1c48 10306a 184a8c 2268ac 3488c8 54a8de 80c6ee b0e4fa e4fcff'),hxs('8cccec b8e8f8 dcf8ff f4ffff ffffff'),f,[('fish',-52,24.5,'#ff9a3a','#ffffff'),('shell',180,24.5,'#ffc8d8','#e88aa8'),('fish',66,24.5,'#ffd84a','#ffffff'),('star',112,24.5,'#ff7a5a','#ffd0a0')],lambda x,y,r,a,v:hx('#e4fcff') if v>.3 and v<.6 and h2(x//2,y,2)>.9 else None)
# halloween: pumpkin ribs, a web, bats and a spider
g=hxs('702a10 a84414 dc6a18 f8942e ffc46a')
f=lambda x,y,r,a,l:pick(g,l+.2*math.cos(a*16)+.05,x,y,.6)
def rm(x,y,r,a,v):
    if v<.5 and r>30 and (abs(math.sin(a*8))<.08 or abs(r-32.5-.7*math.cos(a*16))<.35): return hx('#b8aec8')
make('halloween',hxs('0c0814 181020 261a30 382844 c25a16 d87420 ee902e ffb04c ffd890'),hxs('1a1024 30203c 463052 cfc4da f4ecf8'),f,[('bat',-52,24.5,'#1c1228','#ff8a1a'),('spider',180,24.5,'#1c1228','#ff5a3a'),('bat',66,24.5,'#1c1228','#ff8a1a')],rm,iceF=lambda x,y,r,a,v:pick(hxs('6a5a7c a89cb8 dcd2e6 f8f2fc ffffff'),v,x,y,.4) )
# easter: cream glaze with pastel bands, eggs and flowers
g=hxs('b88468 dcae84 f4d8a8 ffeccc fff8ea');PC=hxs('ff9ec4 9ee6c8 ffe27a c6b4ff')
def f(x,y,r,a,l):
    k=math.floor((a+3.2)*3.2);q=(a+3.2)*3.2-k
    if q<.34:
        c=PC[k%4]; return mix(mix(c,COLD,.25) if l<.35 else c,WARM,.45 if l>.6 else 0) if (int(r)+int(q*9))%4 else (255,255,255)
    return pick(g,l+.15,x,y,.6)
make('easter',hxs('4a2420 6c3a2c 8e543c ac7050 c89068 dcac80 ecc498 f8dcb4 fff0d4'),hxs('e8c8c8 f8e0dc fff2ea fffaf4 ffffff'),f,[('egg',-52,24.5,'#ff8ab8','#fff6a0'),('egg',180,24.5,'#8a9cf4','#ffffff'),('ros',66,24.5,'#ff9ec4','#ffe27a'),('egg',112,24.5,'#6ed8a8','#ffffff')],iceF=lambda x,y,r,a,v:PC[int(h2(x,y,7)*4)] if h2(x,y,5)>.86 else pick(hxs('e8c8c8 f8e0dc fff2ea fffaf4 ffffff'),v,x,y,.4))
# zefir: whipped swirls
g=hxs('c87aa4 e49cc0 f8bcd6 ffd8e8 fff2f8')
f=lambda x,y,r,a,l:pick(g,l*.8+.12+.2*math.sin(a*9+(r-24.5)*.55),x,y,.5)
make('zefir',hxs('5c2450 7c3468 9c4a80 bc6498 d480b0 e89cc4 f4b8d6 ffd4e6 fff0f6'),hxs('f0b8d0 fcd4e4 ffe8f2 fff6fa ffffff'),f,[('heart',-52,24.5,'#ff5a98','#fff'),('heart',180,24.5,'#ff5a98','#fff'),('heart',66,24.5,'#ff5a98','#fff')],lambda x,y,r,a,v:pick(hxs('bc6498 e89cc4 ffd4e6 fff0f6'),v+.25,x,y,.5) if r>30 and math.sin(a*14)>.5 else None)
# newyear: knitted red wool with snowflakes, a spruce rim with lights, snow on the icing
g=hxs('5c0c1c 881424 b82430 dc4444 f47a68')
def f(x,y,r,a,l):
    k=(x%4,(y+(x%4 in(1,2))*1)%3); return pick(g,l+(.18 if k[1]==0 else -.16 if k[1]==2 and k[0] in(0,3) else 0),x,y,.4)
LC=hxs('ff5a5a ffd84a 5ae0ff ff8ae4')
def rm(x,y,r,a,v):
    k=(a+3.1416)*8
    if 31.5<r<33.2 and k%1<.3: return mix(LC[int(k)%4],(255,255,255),.45 if h2(x,y)>.6 else 0)
    return pick(hxs('081c1c 0e2c22 16442c 206038 307c46 4c9c58 7cc07c b4e0a8'),v+.3*(h2(x*.7+y,y*.4)-.5)+.06,x,y,.4)
make('newyear',g,hxs('b4c0e4 d4def4 eef4ff fafcff ffffff'),f,[('flake',-52,24.5,'#ffffff','#bfe4ff'),('flake',180,24.5,'#ffffff','#bfe4ff'),('flake',66,24.5,'#ffffff','#bfe4ff')],rm)

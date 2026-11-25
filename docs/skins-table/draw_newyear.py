# Draws art/cookie-newyear.png (it replaces the newyear part of draw_skins.py). Run from pixel-clicker-vk: python docs/skins-table/draw_newyear.py art/cookie-newyear.png
import re,sys,math
src=open('docs/skins-table/draw_skins.py',encoding='utf8').read()
exec(src[:src.index('def make(')])
OUT=sys.argv[1]
W=hxs('b4a8cc d8d0e4 f2ecf2 fffaf0 ffffff')
im=Image.new('RGBA',(N,N))
def pt(x,y,c):
    if 0<=x<N and 0<=y<N: im.putpixel((x,y),tuple(c)+(255,))
RED=hxs('4a0820 7c0e28 b81c34 e03a48 ff7a78'); WHT=hxs('8c86b4 bcb8d8 e8e4f2 fffaf6 ffffff'); GLD=hxs('7c4410 b8741a ecae30 ffd960 fff6bc')
FIR=hxs('06201e 0c3428 165036 247048 46985a 86c474')
inner=set(body)
for g in gems: inner|=set(g)
for (x,y),(z,r,a) in Z.items():      # small icing dots lying in the band are band too
    if z[0]=='ice' and 20.5<r<29: inner.add((x,y))
rimset=set()
for (x,y),(z,r,a) in Z.items():
    edge=any((x+i,y+j) not in Z or Z[x+i,y+j][0][0]=='sh' for i,j in((1,0),(-1,0),(0,1),(0,-1)))
    if z[0]=='sh': c=hx('#140a22')
    elif (x,y) in inner: 
        l=lite(x,y,r,a); u=(a*r*.9+(r-24.5)*.8)  # glossy red glaze with a soft quilt
        c=pick(hxs('5c0820 8c0f2c b81a34 d8303e f0525a ff8a84'),l*.95+.06+(.22 if 26.2<r<27.4 and a<-.9 else 0),x,y,.5)
    elif z[0]=='rim' and r<25:
        v=z[1]/8; c=hx('#3e1c08') if edge else pick(hxs('3e1c08 6c3210 94501e b86a30 dc9450 f6c488'),v,x,y,.4)
    elif z[0]=='ice' and r<25:
        c=pick(W,.75 if h2(x,y)<.8 else .4,x,y,.5)
    elif z[0]=='ice':
        k=(a*r/3.0)%1; c=GLD[4] if k<.3 else GLD[3] if k<.55 else GLD[2] if k<.8 else GLD[1]
    else:
        c=hx('#04141a') if edge else FIR[0] if (x+y)&1 else FIR[1]
        if not edge: rimset.add((x,y))
    pt(x,y,c)
# the fir branches: strokes of needles, dark first, lit last
import random; random.seed(7)
SPR=[(CX+math.cos(math.radians(t))*24.6,CY+math.sin(math.radians(t))*24.6) for t in (-72,180,90,-109)]
st=[]
for n in range(1500):
    a=random.uniform(-3.15,3.15); r=random.uniform(19.5,29.5); x=CX+math.cos(a)*r;y=CY+math.sin(a)*r
    if (round(x),round(y)) not in inner: continue
    if min((math.hypot(x-px,(y-py)) for px,py in SPR))>7.2 or abs(r-24.6)>2.6 or random.random()<.1: continue
    side=1 if r>24.5 else -1
    px,py=min(SPR,key=lambda q:math.hypot(x-q[0],y-q[1])); d=math.atan2(y-py,x-px)+random.uniform(-.5,.5)
    l=lite(x,y,r,a); st.append((l+random.uniform(-.22,.22),x,y,d))
st.sort(key=lambda s:s[0])
for l,x,y,d in st:
    L=random.choice((3,4,4,5)); b=max(1,min(4,round(.3+l*4.4)))
    for k in range(L):
        px,py=round(x+math.cos(d)*k),round(y+math.sin(d)*k)
        if (px,py) in inner: pt(px,py,FIR[min(5,b+(k==L-1))])

def rimneed():
    o=[]
    for n in range(1500):
        a=random.uniform(-3.15,3.15); r=random.uniform(27.5,36); x=CX+math.cos(a)*r;y=CY+math.sin(a)*r
        q=(round(x),round(y))
        if q not in rimset or r<28.5: continue
        side=1 if r>31.6 else -1
        l=.42+.3*(-(math.cos(a)+math.sin(a))*(r-31.5)/4)+.16*(-(x-CX)-(y-CY))/34+(.16 if abs(r-31.6)<1 else 0)
        o.append((l+random.uniform(-.2,.2),x,y,a+math.pi/2-side*-1*random.uniform(.3,.95)*-1,r))
    o.sort(key=lambda s:s[0])
    for l,x,y,d,r in o:
        b=max(1,min(4,round(.4+l*4.2)))
        for k in range(4):
            X,Y=round(x+math.cos(d)*k),round(y+math.sin(d)*k)
            if (X,Y) in rimset or ((X,Y) in Z and Z[X,Y][0][0]=='ice' and Z[X,Y][1]>29.2 and k==3): pt(X,Y,FIR[min(5,b+(k==3))])
def P_(ang,rad): return CX+math.cos(math.radians(ang))*rad, CY+math.sin(math.radians(ang))*rad
def bauble(ang,R,col,cap=True,rad=24.6,stripe=None):
    cx,cy=P_(ang,rad);cx=round(cx)+(0 if R%1==0 else .5);cy=round(cy)+(0 if R%1==0 else .5);q=ramp(col,.72,.75)
    for y in range(int(cy-R)-1,int(cy+R)+3):
        for x in range(int(cx-R)-1,int(cx+R)+3):
            u,w=(x-cx)/R,(y-cy)/R;d=u*u+w*w
            if (u-.28)**2+(w-.3)**2<1.2 and d>1.06 and (x,y) in Z and Z[x,y][0][0]!='sh': pt(x,y,mix(im.getpixel((x,y))[:3],COLD,.6))
    for y in range(int(cy-R)-1,int(cy+R)+2):
        for x in range(int(cx-R)-1,int(cx+R)+2):
            u,w=(x-cx)/R,(y-cy)/R;d=u*u+w*w
            if d>1.06: continue
            v=.16+.5*max(0,1-d)+.36*(-u-w)*.6
            if math.hypot(u-.42,w-.5)<.33: v+=.26
            c=pick(q,max(0,min(1,v)),x,y,.2)
            if stripe and abs(w+.12*u*u-.05)<.13: c=pick(ramp(stripe),max(.3,min(1,v+.1)),x,y,.2)
            if d>.82 and (u+w)>.1: c=q[0]
            pt(x,y,c)
    X,Y=round(cx-R*.42),round(cy-R*.45); pt(X,Y,(255,255,255)); pt(X+1,Y,(255,255,255)); pt(X,Y+1,(255,255,255))
    if cap:
        t=round(cy-R)-1
        for i,c in enumerate((4,3,1)): pt(round(cx)-1+i,t,GLD[c])
        pt(round(cx),t-1,GLD[3])
rimneed()
bauble(-72,4.5,'#f4b428',stripe='#fff4d0')
bauble(180,4.5,'#f4b428',stripe='#fff4d0')
bauble(90,4.5,'#f4b428',stripe='#fff4d0')
bauble(-109,3.5,'#3a86f0')
bauble(130,3,'#3bb36a')
bauble(46,3,'#3a86f0')

def berry(ang,rad):
    cx,cy=map(round,P_(ang,rad))
    for dx,dy in((0,0),(2,1),(1,-1)):
        pt(cx+dx,cy+dy+1,RED[0]);pt(cx+dx+1,cy+dy+1,RED[0])
    for dx,dy in((0,0),(2,1),(1,-1)):
        pt(cx+dx,cy+dy,RED[3]);pt(cx+dx+1,cy+dy,RED[2]);pt(cx+dx,cy+dy-0,RED[4])

# small lamps of the garland, on a thin golden wire winding over the branches
bulbs=[]
cols=['#ff5a5a','#ffd84a','#5ae0ff','#ff8ae4']
for i,(a,r) in enumerate([(t,31.8) for t in (26,42,58,74,90,106,122,138,154,170,186,202,-32,-16)]):
    cx,cy=map(round,P_(a,r)); 
    if (cx,cy) not in rimset: continue
    c=hx(cols[i%4])
    for dx,dy,k in((0,0,.65),(1,0,.2),(0,1,0),(1,1,-.3)):
        pt(cx+dx,cy+dy,mix(c,(255,255,255),k) if k>=0 else mix(c,COLD,-k))
    bulbs.append((cx,cy,i%4))

def flake(ang,g,rad=24.5):
    ox,oy=P_(ang,rad);ox=round(ox)-len(g[0])//2;oy=round(oy)-len(g)//2
    for j,row in enumerate(g):
        for i,ch in enumerate(row):
            if ch!='.':
                if (ox+i+1,oy+j+1) in inner: pt(ox+i+1,oy+j+1,mix(im.getpixel((ox+i+1,oy+j+1))[:3],COLD,.4))
    for j,row in enumerate(g):
        for i,ch in enumerate(row):
            if ch!='.' and (ox+i,oy+j) in inner: pt(ox+i,oy+j,hx('#ffffff') if ch=='x' else hx('#cfe4ff'))
F7=['...x...','.x.x.x.','..xxx..','xxxoxxx','..xxx..','.x.x.x.','...x...'];F5=['x.x.x','.xxx.','xxoxx','.xxx.','x.x.x']
for t,g in((-38,F7),(151,F5),(111,F5),(67,F5)): flake(t,g)
# snow caps
def snow(x,y0,t):
    for k in range(t):
        pt(x,y0+k,(255,255,255) if k<max(1,t*.45) else hx('#eaf2ff') if k<t-2 else hx('#c8d6f4') if k<t-1 else hx('#94a8d8'))
    for k in range(1):
        if t and (x,y0+t) in Z: pt(x,y0+t,mix(im.getpixel((x,y0+t))[:3],COLD,.45))
cols_={}
for x in range(N):
    ys=[y for y in range(N) if (x,y) in Z and Z[x,y][0][0]!='sh']
    if not ys: continue
    runs=[];s=ys[0];p=s
    for y in ys[1:]+[999]:
        if y!=p+1: runs.append((s,p)); s=y
        p=y
    cols_[x]=runs
def th(x,x0,x1,base,amp,s):
    e=min(1,(x-x0)/8,(x1-x)/6)
    return max(0,round(e*(base+amp*math.sin(x*.55+s)+amp*.6*math.sin(x*.23+s*2))))
for x in range(13,61):
    if x in cols_: snow(x,cols_[x][0][0],th(x,13,61,5,1.7,0))
for x in range(26,66):        # the lower arm, seen inside the hole
    if x in cols_ and len(cols_[x])>1: snow(x,cols_[x][1][0],th(x,30,66,3.2,1,1))
# icicles under the upper arm
for x,L in((22,3),(26,5),(27,2),(31,7),(32,3),(36,4),(40,6),(41,3),(45,3)):
    if x in cols_ and len(cols_[x])>1:
        y=cols_[x][0][1]+1
        while (x,y) in Z and Z[x,y][0][0]=='sh' and y<cols_[x][0][1]+3: y+=1
        y=cols_[x][0][1]
        for k in range(L+1): pt(x,y+k,hx(('#f6fcff','#e2f4ff','#c4e4fc','#a4ccf0','#86b0e0')[min(4,k*5//(L+1))]))
# the velvet bow with a bell
BOW='''
..kkkk.....kkkk..
.kRrrrkk.kkRrrrk.
kRLrrrrrkrLLrrrdk
krLrrrdkgkrrrrrdk
krrrrdkgGgkdrrrdk
.krrddkgggkddrrk.
..kdddkkgkkdddk..
...kkRrdkRrrkk...
..kRrrdkkkRrrdk..
.kRrrdkYWykrrrdk.
.krrdkYWYyokrrdk.
kRrdkyWYYyookrrdk
krdk.kYYyook.krdk
kdk.kYWYyyook.kdk
.k..kkkkOkkkk..k.
.......kok.......
'''.strip().split('\n')
pal=dict(k='#34061c',R='#ff7478',L='#ffa8a0',r='#d82a40',d='#8a1030',g='#f0b43a',G='#fff2b0',Y='#ffd860',W='#fffbe0',y='#f0b030',o='#b06a18',O='#7a4410')
bx,by=7,11
done=set()
for j,row in enumerate(BOW):
    for i,ch in enumerate(row):
        for d in (1,2):
            q=(bx+i+d,by+j+d)
            if ch!='.' and q in Z and Z[q][0][0]!='sh' and not(0<=j+d<len(BOW) and 0<=i+d<len(BOW[j+d]) and BOW[j+d][i+d]!='.') and q not in done: done.add(q); pt(*q,mix(im.getpixel(q)[:3],COLD,.55))
for j,row in enumerate(BOW):
    for i,ch in enumerate(row):
        if ch!='.': pt(bx+i,by+j,hx(pal[ch]))
im.save(OUT)
print('bulbs',bulbs,im.getbbox())

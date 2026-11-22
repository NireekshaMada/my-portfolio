"""
Procedural ivory / peach ribbon sculpture, software-rendered with numpy.
Writes a transparent PNG (sculpture + soft cast shadow) for the portfolio hero.
"""
import sys, time
import numpy as np, cv2
from scipy.interpolate import CubicSpline
from scipy.ndimage import gaussian_filter, binary_closing, distance_transform_edt

SS = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0
OUT_PATH = sys.argv[2] if len(sys.argv) > 2 else "/home/claude/work/ribbon.png"
SEED = int(sys.argv[3]) if len(sys.argv) > 3 else 3
W, H = int(3200 * SS), int(2000 * SS)
SCALE = W / 2 / 1.55
D_CAM = 3.4
CAM = np.array([0.0, 0.0, D_CAM])
t0 = time.time()
def log(*a): print(f"[{time.time()-t0:5.1f}s]", *a, flush=True)

def unit(a):
    return a / np.maximum(np.linalg.norm(a, axis=-1, keepdims=True), 1e-9)
pts = np.array([
    [ 1.80,  0.98, -0.45],
    [ 1.25,  0.55,  0.20],
    [ 0.78,  0.66,  0.72],
    [ 0.52,  0.20,  0.35],
    [ 0.92, -0.10, -0.25],
    [ 1.12, -0.46,  0.30],
    [ 0.62, -0.74,  0.70],
    [-0.05, -0.74,  0.30],
    [-0.80, -0.92, -0.05],
    [-1.90, -0.88,  0.15],
])
spl = CubicSpline(np.linspace(0, 1, len(pts)), pts, bc_type="natural")

K = 5
GAP = 0.082
MAT_A = [(208,162,112),(222,182,134),(231,196,152),(238,210,176),(204,140,98)]   # outer face (golden / beige)
MAT_B = [(238,184,156),(243,197,172),(247,210,188),(250,222,203),(228,156,124)]   # inner face (peach)
MAT_E = (247,228,206)

def frame(u):
    T = unit(spl(u, 1))
    N0 = np.array([0, 0, 1.0])
    Nn = unit(N0 - (T @ N0)[:, None] * T)
    Bn = np.cross(T, Nn)
    return T, Nn, Bn

def base_twist(u):
    return np.pi / 2 + 1.0 * np.sin(2*np.pi*(1.15*u + 0.12)) + 0.30*np.sin(2*np.pi*(2.6*u + 0.2))

def base_width(u):
    return 0.50 + 0.17 * np.sin(2*np.pi*(0.9*u + 0.35))

def curl_amt(u):
    return 2.4 * np.sin(2*np.pi*(0.8*u + 0.3))

def build(k, nu, nv, face):
    """Return dict of attribute arrays (flattened) for ribbon k; face: 0 outer,1 inner,2 edge-lo,3 edge-hi."""
    u = np.linspace(0, 1, nu)
    T, Nn, Bn = frame(u)
    phi = base_twist(u)
    Dv = np.cos(phi)[:, None]*Nn + np.sin(phi)[:, None]*Bn
    Nrm_base = unit(np.cross(T, Dv))
    phik = phi + 0.10*(k-2)*np.sin(2*np.pi*(1.7*u + 0.2*k))
    Dk = np.cos(phik)[:, None]*Nn + np.sin(phik)[:, None]*Bn
    Nk = unit(np.cross(T, Dk))
    S = spl(u) + (k-2)*GAP*Nrm_base
    w = base_width(u) * (1 - 0.07*abs(k-2)) + 0.03*np.sin(2*np.pi*(3*u + k))
    c = curl_amt(u) * (1 + 0.15*(k-2))
    thick = 0.020
    if face in (0, 1):
        v = np.linspace(-0.5, 0.5, nv)
        wv = v[None, :, None]*w[:, None, None]
        P = S[:, None, :] + wv*Dk[:, None, :] + (c[:, None, None]*wv**2)*Nk[:, None, :]
        sign = 1.0 if face == 0 else -1.0
        P = P + sign*(thick/2)*Nk[:, None, :]
        Pu = np.gradient(P, axis=0); Pv = np.gradient(P, axis=1)
        N = unit(np.cross(Pu, Pv))*sign
        Tt = unit(Pu)
        uu = np.broadcast_to(u[:, None], (nu, nv)); vv = np.broadcast_to(v[None, :], (nu, nv))
    else:
        s = np.linspace(-0.5, 0.5, max(nv // 12, 6))
        vedge = -0.5 if face == 2 else 0.5
        wv = vedge*w
        base = S + wv[:, None]*Dk + (c*wv**2)[:, None]*Nk
        P = base[:, None, :] + (s[None, :, None]*thick)*Nk[:, None, :]
        N = np.broadcast_to((np.sign(vedge)*Dk)[:, None, :], P.shape)
        Tt = np.broadcast_to(T[:, None, :], P.shape)
        uu = np.broadcast_to(u[:, None], P.shape[:2]); vv = np.full(P.shape[:2], vedge)
    P = P.reshape(-1, 3).astype(np.float32); N = np.asarray(N).reshape(-1, 3).astype(np.float32)
    Tt = np.asarray(Tt).reshape(-1, 3).astype(np.float32)
    mat = {0: k*3, 1: k*3+1, 2: k*3+2, 3: k*3+2}[face]
    return P, N, Tt, uu.reshape(-1).astype(np.float32), vv.reshape(-1).astype(np.float32), mat

def project(P):
    s = D_CAM / (D_CAM - P[:, 2])
    px = W/2 + P[:, 0]*s*SCALE
    py = H/2 - P[:, 1]*s*SCALE
    return px, py
zbuf = np.full(H*W, -9.0, dtype=np.float32)
attr = np.zeros((H*W, 12), dtype=np.float32)

def splat(P, N, Tt, uu, vv, mat):
    px, py = project(P)
    z = P[:, 2]
    base_ix = np.floor(px).astype(np.int64); base_iy = np.floor(py).astype(np.int64)
    data = np.concatenate([P, N, Tt, uu[:, None], vv[:, None], np.full((len(P), 1), mat, np.float32)], axis=1)
    for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1)):
        ix = base_ix + dx; iy = base_iy + dy
        ok = (ix >= 0) & (ix < W) & (iy >= 0) & (iy < H)
        idx = iy[ok]*W + ix[ok]; zz = z[ok]; dd = data[ok]
        order = np.argsort(zz, kind="stable")
        idx = idx[order]; zz = zz[order]; dd = dd[order]
        win = zz > zbuf[idx]
        zbuf[idx[win]] = zz[win]
        attr[idx[win]] = dd[win]

NU, NV = int(4600*SS), int(340*SS)
for k in range(K):
    for face in (0, 1, 2, 3):
        splat(*build(k, NU, NV, face))
    log("ribbon", k, "rasterised")

cov = (zbuf > -8).reshape(H, W)
closed = binary_closing(cov, structure=np.ones((3, 3)), iterations=1)
holes = closed & ~cov
if holes.any():
    ind = distance_transform_edt(~cov, return_indices=True, return_distances=False)
    fy, fx = ind[0][holes], ind[1][holes]
    src = fy*W + fx; dst = np.flatnonzero(holes.reshape(-1))
    attr[dst] = attr[src]; zbuf[dst] = zbuf[src]
    cov = closed
log("holes filled:", int(holes.sum()))

LK = unit(np.array([-0.55, 0.70, 0.50]))
LF = unit(np.array([0.65, 0.05, 0.55]))
e1 = unit(np.cross(np.array([0, 1.0, 0]), LK)); e2 = np.cross(LK, e1)
SM = 3072
LX0, LX1, LY0, LY1 = -2.7, 2.7, -2.2, 2.2
smap = np.full(SM*SM, -9.0, dtype=np.float32)
def to_light(P):
    lx = (P @ e1 - LX0)/(LX1-LX0)*SM; ly = (P @ e2 - LY0)/(LY1-LY0)*SM; lz = P @ LK
    return lx, ly, lz.astype(np.float32)
for k in range(K):
    for face in (0, 1, 2, 3):
        P = build(k, NU, NV, face)[0]
        lx, ly, lz = to_light(P)
        bx = np.floor(lx).astype(np.int64); by = np.floor(ly).astype(np.int64)
        for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1)):
            ix = bx+dx; iy = by+dy
            ok = (ix >= 0) & (ix < SM) & (iy >= 0) & (iy < SM)
            np.maximum.at(smap, iy[ok]*SM + ix[ok], lz[ok]) if False else None
            idx = iy[ok]*SM + ix[ok]; zz = lz[ok]
            order = np.argsort(zz, kind="stable"); idx = idx[order]; zz = zz[order]
            win = zz > smap[idx]
            smap[idx[win]] = zz[win]
smap = smap.reshape(SM, SM)
log("shadow map ready")

def shadow_lookup(P, bias):
    lx, ly, lz = to_light(P)
    ix = np.clip(lx.astype(np.int64), 0, SM-1); iy = np.clip(ly.astype(np.int64), 0, SM-1)
    return (smap[iy, ix] > lz + bias).astype(np.float32)

cov_flat = cov.reshape(-1)
ids = np.flatnonzero(cov_flat)
A = attr[ids]
Pw, Nw, Tw = A[:, 0:3], A[:, 3:6], A[:, 6:9]
uu, vv, mat = A[:, 9], A[:, 10], A[:, 11].astype(np.int32)
V = unit(CAM[None, :] - Pw)
flip = (np.sum(Nw*V, axis=1) < 0)
Nw = np.where(flip[:, None], -Nw, Nw)

ndl_k = np.sum(Nw*LK, axis=1); ndl_f = np.sum(Nw*LF, axis=1)
bias = 0.020 + 0.060*(1 - np.abs(ndl_k))
sh = shadow_lookup(Pw, bias)

shimg = np.zeros(H*W, np.float32); shimg[ids] = sh
shimg = gaussian_filter(shimg.reshape(H, W), 3.2*SS).reshape(-1)
sh = 1 - 0.48*shimg[ids]            

wrap = 0.35
diff_k = np.clip((ndl_k + wrap)/(1+wrap), 0, 1)
diff_f = np.clip((ndl_f + 0.2)/1.2, 0, 1)
Hh = unit(LK[None, :] + V)
blinn = np.clip(np.sum(Nw*Hh, axis=1), 0, 1) ** 55
th = np.sum(Tw*Hh, axis=1)
kk = np.clip(1 - th*th, 0, 1) ** 28
spec = (0.16*blinn + 0.20*kk*np.clip(ndl_k, 0, 1))
zimg = np.where(cov, zbuf.reshape(H, W), -1.2).astype(np.float32)
ao = np.zeros((H, W), np.float32)
for sig, wgt in ((10*SS, 1.6), (34*SS, 1.2)):
    ao += wgt*np.clip(gaussian_filter(zimg, sig) - zimg, 0, None)
ao = np.clip(ao*2.6, 0, 1)
ao_f = 1 - 0.42*ao.reshape(-1)[ids]
matA = np.array(MAT_A + [MAT_E]*0, dtype=np.float32)
alb = np.zeros((len(ids), 3), np.float32)
kidx = mat // 3; kind = mat % 3
for kk_ in range(K):
    m0 = (kidx == kk_) & (kind == 0); m1 = (kidx == kk_) & (kind == 1); m2 = (kidx == kk_) & (kind == 2)
    alb[m0] = MAT_A[kk_]; alb[m1] = MAT_B[kk_]; alb[m2] = MAT_E
alb /= 255.0
tex = 1 + 0.045*np.sin(2*np.pi*(vv + 0.5)*150) * (kind[:, None][:, 0] == 0)
tex = tex + 0.012*np.sin(2*np.pi*uu*520)
drift = 1 + 0.07*np.sin(2*np.pi*(uu*1.3 + kidx*0.17))
alb *= (tex*drift)[:, None]
amb = 0.42 + 0.14*Nw[:, 1]
warm = np.array([1.00, 0.84, 0.70], np.float32)[None, :]
light = (amb[:, None]*ao_f[:, None])*warm*1.15 + (0.78*diff_k*sh)[:, None] + (0.16*diff_f*ao_f)[:, None]*warm
col = alb*light + (spec*sh)[:, None]*np.array([1.0, 0.93, 0.82])[None, :]
col = col/(1 + 0.18*col)
col = np.clip(col*1.16, 0, 1)
col = col ** 0.96
colimg = np.zeros((H*W, 3), np.float32); colimg[ids] = col
colimg = colimg.reshape(H, W, 3)
alpha_s = cov.astype(np.float32)
def smooth(x): return x*x*(3-2*x)
fx = np.clip(np.arange(W)/(0.26*W), 0, 1); fy = np.clip(np.arange(H)/(0.08*H), 0, 1)
fade = (smooth(fx)[None, :]*smooth(fy)[:, None]).astype(np.float32)
alpha_s = alpha_s*fade
Z0 = -1.45
s0 = D_CAM/(D_CAM - Z0)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
X = (xx - W/2)/SCALE/s0; Y = -(yy - H/2)/SCALE/s0
Pp = np.stack([X.reshape(-1), Y.reshape(-1), np.full(H*W, Z0, np.float32)], axis=1)
lz_plane = (Pp @ LK).astype(np.float32)
lx = (Pp @ e1 - LX0)/(LX1-LX0)*SM; ly = (Pp @ e2 - LY0)/(LY1-LY0)*SM
ix = np.clip(lx.astype(np.int64), 0, SM-1); iy = np.clip(ly.astype(np.int64), 0, SM-1)
inside = (lx >= 0) & (lx < SM) & (ly >= 0) & (ly < SM)
wall = ((smap[iy, ix] > lz_plane + 0.03) & inside).astype(np.float32).reshape(H, W)
wall = 0.55*gaussian_filter(wall, 14*SS) + 0.45*gaussian_filter(wall, 46*SS)
halo = gaussian_filter(alpha_s, 26*SS)
shadow_a = np.clip(wall*0.34 + halo*0.10, 0, 0.42)*fade
shadow_col = np.array([146, 92, 62], np.float32)/255.0
log("backdrop shadow ready")
a_out = alpha_s + (1 - alpha_s)*shadow_a
rgb_pm = colimg*alpha_s[..., None] + shadow_col[None, None, :]*(shadow_a*(1 - alpha_s))[..., None]
rgb_pm = cv2.resize(rgb_pm, (2400, 1500), interpolation=cv2.INTER_AREA)
a_out = cv2.resize(a_out, (2400, 1500), interpolation=cv2.INTER_AREA)
rgb = np.where(a_out[..., None] > 1e-4, rgb_pm/np.maximum(a_out[..., None], 1e-4), 0)
out = np.dstack([np.clip(rgb, 0, 1), a_out])
cv2.imwrite(OUT_PATH, cv2.cvtColor((out*255 + 0.5).astype(np.uint8), cv2.COLOR_RGBA2BGRA))
log("saved", OUT_PATH)

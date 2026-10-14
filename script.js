(function() {
        var cv=document.getElementById('c'), ctx=cv.getContext('2d'), meter=document.getElementById('meter');
        var W=0, H=0, dpr=1, cx=0, cy=0, R=0, fs=0;
        var angle=0, omega=0, crazy=false, dragging=false;
        var n=4, lastA=0, lastT=0, flipT=0, shake=0, faceT=0;
        var MAX=160;
        var FONT='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

        var offs= {}

        ;

        function measure(ch, size) {
            var key=ch+size;
            if(offs[key])return offs[key];
            var s=Math.ceil(size*2), o=document.createElement('canvas');
            o.width=o.height=s;

            var g=o.getContext('2d', {
                willReadFrequently:true
            });
        g.font=size+'px ' +FONT; g.textAlign='center'; g.textBaseline='middle';
        g.fillText(ch, s/2, s/2);
        var d=g.getImageData(0, 0, s, s).data, x0=s, x1=-1, y0=s, y1=-1, x, y;

        for(y=0; y<s; y++)for(x=0; x<s; x++) {
            if(d[(y*s+x)*4+3]>16) {
                if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y;
            }
        }

        offs[key]=x1<0? {
            x:0, y:0
        }

        : {
            x:(x0+x1+1)/2-s/2, y:(y0+y1+1)/2-s/2
        }

        ;
        return offs[key];
    }

    function glyph(ch, size) {
        var o=measure(ch, size);
        ctx.font=size+'px ' +FONT;
        ctx.fillText(ch, -o.x, -o.y);
    }

    function resize() {
        dpr=Math.min(window.devicePixelRatio||1, 2);
        W=cv.clientWidth; H=cv.clientHeight;
        cv.width=W*dpr; cv.height=H*dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx=W/2; cy=H/2;
        var m=Math.min(W, H);
        fs=Math.round(m*0.2); R=m*0.21;

        offs= {}

        ;
    }

    window.addEventListener('resize', resize); resize();

    function ang(e) {
        var r=cv.getBoundingClientRect(); return Math.atan2(e.clientY-r.top-cy, e.clientX-r.left-cx);
    }

    cv.addEventListener('pointerdown', function(e) {
            dragging=true; cv.setPointerCapture(e.pointerId);
            lastA=ang(e); lastT=performance.now(); omega=0; crazy=false;
        });

    cv.addEventListener('pointermove', function(e) {
            if( !dragging)return;
            var a=ang(e), t=performance.now(), d=a-lastA;
            while(d>Math.PI)d-=2*Math.PI;
            while(d<-Math.PI)d+=2*Math.PI;
            var dt=Math.max((t-lastT)/1000, 0.001);
            angle+=d;
            omega=omega*0.6+(d/dt)*0.4;
            lastA=a; lastT=t;
        });

    function up() {
        if( !dragging)return; dragging=false;
        if(performance.now()-lastT>120)omega=0;
        omega=Math.max(-MAX, Math.min(MAX, omega));
    }

    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    function hands(a, alpha) {
        ctx.globalAlpha=alpha;

        for(var i=0; i<n; i++) {
            ctx.save();
            var th=a+i*2*Math.PI/n;
            ctx.rotate(th);
            ctx.translate(0, -R);

            if(crazy) {
                ctx.rotate(-th); glyph('🫵', fs);
            }

            else glyph('👆', fs);
            ctx.restore();
        }
    }

    var prev=performance.now();

    function frame(t) {
        var dt=Math.min((t-prev)/1000, 0.05); prev=t;

        if( !dragging) {
            if(crazy) {
                flipT-=dt;

                if(flipT<=0) {
                    flipT=2+Math.random()*3; omega=(Math.random()<0.5?-1:1)*(60+Math.random()*90);
                }

                var s=omega>=0?1:-1;
                omega+=(s*3.1416-omega)*(1-Math.exp(-1.2*dt));
            }

            else omega*=Math.exp(-0.45*dt);
            if(Math.abs(omega)<0.02)omega=0;
            omega=Math.max(-MAX, Math.min(MAX, omega));
            angle+=omega*dt;
        }

        var sp=Math.abs(omega);
        var kpm=sp*60/(2*Math.PI);
        if(dragging)crazy=kpm>100; else if(kpm>100)crazy=true;
        shake=crazy?Math.min(sp/12, 10):0;
        faceT+=dt*sp*0.05;

        ctx.clearRect(0, 0, W, H);
        ctx.save();
        if(shake>0)ctx.translate((Math.random()-.5)*shake, (Math.random()-.5)*shake);
        ctx.translate(cx, cy);
        ctx.textAlign='center'; ctx.textBaseline='middle';

        var ghosts=sp>8?Math.min(6, Math.floor(sp/10)+2):0;

        for(var g=ghosts; g>=1; g--) {
            hands(angle-Math.sign(omega)*g*Math.min(sp*0.004, 0.12), 0.13);
        }

        hands(angle, 1);

        ctx.globalAlpha=1;
        ctx.save();
        ctx.rotate(crazy?Math.sin(faceT)*0.35:0);
        glyph(crazy?'😳':'😁', fs);
        ctx.restore();
        ctx.restore();

        meter.textContent=(omega<0?'↺ ':'↻ ')+Math.round(kpm)+' kpm' +(crazy?' 🔥':'');
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
})();

(function(){
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.__ssReducedMotion = reduced;

  /* Custom cursor — desktop pointer only */
  if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches){
    document.documentElement.classList.add('has-cursor');
    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    document.body.appendChild(dot);
    var mx=innerWidth/2, my=innerHeight/2;
    window.addEventListener('mousemove', function(e){ mx=e.clientX; my=e.clientY; });
    function loop(){
      var dotSize = dot.classList.contains('cursor-dot--active') ? 10 : 4.5;
      dot.style.transform = 'translate('+(mx-dotSize)+'px,'+(my-dotSize)+'px)';
      requestAnimationFrame(loop);
    }
    loop();
    document.querySelectorAll('a,button,.swipe-card,.road-card').forEach(function(el){
      el.addEventListener('mouseenter', function(){ dot.classList.add('cursor-dot--active'); });
      el.addEventListener('mouseleave', function(){ dot.classList.remove('cursor-dot--active'); });
    });
  }

  /* Scroll reveal */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in-view'); io.unobserve(en.target); } });
  }, { threshold:0.15 });
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  /* Swipeable tracks (drag on desktop, native touch on mobile) */
  document.querySelectorAll('[data-swipe]').forEach(function(track){
    var isDown=false, startX=0, scrollStart=0;
    track.addEventListener('pointerdown', function(e){
      if (e.pointerType === 'touch') return;
      isDown=true; track.classList.add('dragging'); startX=e.pageX; scrollStart=track.scrollLeft;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', function(e){
      if(!isDown) return;
      track.scrollLeft = scrollStart - (e.pageX - startX);
    });
    ['pointerup','pointerleave','pointercancel'].forEach(function(evt){
      track.addEventListener(evt, function(){ isDown=false; track.classList.remove('dragging'); });
    });
  });

  /* Magnetic primary buttons */
  if (!reduced){
    document.querySelectorAll('.btn-primary').forEach(function(btn){
      btn.addEventListener('mousemove', function(e){
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width/2, y = e.clientY - r.top - r.height/2;
        btn.style.transform = 'translate('+(x*0.18)+'px,'+(y*0.35)+'px)';
      });
      btn.addEventListener('mouseleave', function(){ btn.style.transform = 'translate(0,0)'; });
    });
  }
})();

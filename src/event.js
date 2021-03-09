export default  {
  wheelFunc: function(e) {
    var e = e || window.event;
    if (this.isScroll) {
      return;
    }
    var curTime = new Date().getTime();
    var timeDiff = curTime - prevTime;
    prevTime = curTime;
    if(timeDiff <= 200){
      return;
    }
    if (e.wheelDeltaY < 0 || e.wheelDelta < 0 || e.detail > 0) {
      this.canSlide && this.canNext && this.slideNext();
    } else if (e.wheelDeltaY > 0 || e.wheelDelta > 0 || e.detail < 0) {
      this.canSlide && this.canPrev && this.slidePrev();
    }
  },
  touchStart: function(e) {
    if (!this.canSlide) {
      touchPoint.startpoint = -1;
    } else {
      touchPoint.startpoint = e.targetTouches[0].clientY;
    }
  },
  touchMove: function(e) {
    if (touchPoint.startpoint === -1) {
      e.preventDefault();
      return false;
    }
    var offsetY = e.targetTouches[0].clientY - touchPoint.startpoint;
    !this.canPrev && offsetY > 5 && (this.isScroll = true);    //-- 滚动到底部往上滑可继续滚动条滚动
    !this.canNext && offsetY < -5 && (this.isScroll = true);   //-- 滚动到顶部往下滑可继续滚动条滚动
    !this.isScroll && e.preventDefault();
    if (this.opt.dragMode && this.canSlide && this.isScroll != true) {
      if (offsetY < -5 && this.count > this.page && this.canNext) {
        this.items[this.page-1].style.transform = 'translate3d(0, ' + offsetY.toFixed(2) + 'px, 0)';
        this.items[this.page].style.transform = 'translate3d(0, ' + (window.innerHeight + offsetY).toFixed(2) + 'px, 0)';
        touchPoint.endpoint = e.targetTouches[0].clientY;
      }
      if (offsetY > 5 && this.page > 1 && this.canPrev) {
        this.items[this.page - 2].style.transform = 'translate3d(0, -' + (window.innerHeight - offsetY).toFixed(2) + 'px, 0)';
        this.items[this.page - 1].style.transform = 'translate3d(0, ' + offsetY.toFixed(2) + 'px, 0)';
        touchPoint.endpoint = e.targetTouches[0].clientY;
      }
    }
    if (!this.opt.dragMode) {
      touchPoint.endpoint = e.targetTouches[0].clientY;
    }
  },
  touchEnd: function(e) {
    if (touchPoint.endpoint === 0 || touchPoint.startpoint === -1) {
      return false;
    }
    var offsetDrag = (touchPoint.endpoint - touchPoint.startpoint)
    if (this.opt.dragMode) {
      var thresholdDistance = window.innerHeight / 4;
      if (offsetDrag < -1 * thresholdDistance) {
        this.canSlide && this.canNext && this.slideNext();
      } else if (offsetDrag > thresholdDistance) {
        this.canSlide && this.canPrev && this.slidePrev();
      } else if (offsetDrag > -1 * thresholdDistance && offsetDrag < thresholdDistance) {
        methods.resetSlideForDrag();
      }
    } else {
      if ((touchPoint.endpoint - touchPoint.startpoint) < -60) {
        this.canSlide && this.canNext && this.slideNext();
      } else if ((touchPoint.endpoint - touchPoint.startpoint) > 60) {
        this.canSlide && this.canPrev && this.slidePrev();
      }
    }
    touchPoint.startpoint = 0;
    touchPoint.endpoint = 0;
  },
  transitionEnd: function(event) {
    if (utils.isEqualNode(event.target, this.items[this.page - 1])) {
      if (this.opt.dragMode) {
        this.items[this.page - 1].classList.remove('transition');
        this.items[this.page - 2] && this.items[this.page - 2].classList.remove('transition');
        this.items[this.page] && this.items[this.page].classList.remove('transition');
      }
      if (this.direction == 'next') {
        this.opt.after(this.page - 1, this.direction, this.page);
        this.opt.refresh && methods.resetAnimation.call(this, this.page - 2);
      } else if (this.direction == 'prev') {
        this.opt.after(this.page + 1, this.direction, this.page);
        this.opt.refresh && methods.resetAnimation.call(this, this.page);
      }
      this.canSlide = true;
    }
  }
}

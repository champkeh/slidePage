// 滑屏基础方法
var methods = {
  slideScroll: function(index, command) {
    var itemheight = this.items[index].children[0].offsetHeight;
    var windowH = window.innerHeight;
    var judgeScroll = function (index) {
      var windowH = window.innerHeight;
      var isBottom = itemheight <= this.items[index].scrollTop + windowH;
      var isTop = this.items[index].scrollTop == 0;
      this.canPrev = isTop && !isBottom;
      this.canNext = isBottom && !isTop;
      this.isScroll = !(isBottom || isTop)
    }.bind(this, index)
    if (command == 'removeListener') {
      this.items[index].removeEventListener('scroll', judgeScroll);
      return;
    }
    if ((itemheight - windowH) > 10) {
      this.items[index].children[0].children[0].focus();
      judgeScroll();
      if (this.direction == 'next') {
        this.items[index].scrollTop = 0;
      } else if (this.direction == 'prev') {
        this.items[index].scrollTop = itemheight - windowH;
      }
      this.items[index].addEventListener('scroll', judgeScroll);
    } else {
      this.canPrev = true;
      this.canNext = true;
      this.isScroll = false;
    }
  },
  resetSlideForDrag: function() {
    this.canSlide = false;
    this.items[this.page - 1].classList.add('transition');
    this.items[this.page - 1].style.transform = 'translate3d(0, 0, 0)';
    if (this.items[this.page - 2]) {
      this.items[this.page - 2].classList.add('transition');
      this.items[this.page - 2].style.transform = 'translate3d(0, -100%, 0)';
    }
    if (this.items[this.page]) {
      this.items[this.page].classList.add('transition');
      this.items[this.page].style.transform = 'translate3d(0, 100%, 0)';
    }
  },
  // 重置动画状态，全部隐藏
  resetAnimation: function(index) {
    if (this.opt.useAnimation && this.opt.refresh) {
      if (!this.items[index]) {
        return false;
      }
      var steps = Array.prototype.slice.call(this.items[index].querySelectorAll('.step'));
      var lazys = Array.prototype.slice.call(this.items[index].querySelectorAll('.lazy'));
      steps.map((element) => {
        element.style.visibility = 'hidden';
        element.style.animationName = '__' + window.getComputedStyle(element).animationName;
      })
      lazys.map((element) => {
        element.style.visibility = 'hidden';
        element.style.animationName = '__' + window.getComputedStyle(element).animationName;
      })
    }
  },
  // 自动触发动画
  runAnimation: function(index, lazy) {
    if (this.opt.useAnimation) {
      var steps = this.items[index].querySelectorAll(lazy || '.step');
      Array.prototype.slice.call(steps).map((element) => {
        triggerAnim(element);
      })
      function triggerAnim(element) {
        var delay = element.getAttribute('data-delay') || 100;
        var timer = setTimeout(function () {
          // 将style属性去除即可播放动画
          element.style.visibility = '';
          element.style.animationName = '';
          clearTimeout(timer);
        }, delay);
      }
    }
  },
  initAnimation: function(items, index) {
    if (this.opt.useAnimation) {
      var steps = Array.prototype.slice.call(this.container.querySelectorAll('.step'));
      var lazys = Array.prototype.slice.call(this.container.querySelectorAll('.lazy'));
      steps.map((element) => {
        // 初始设置动画元素为不可见，且animationName是不可用的以控制不播放动画
        element.style.visibility = 'hidden';
        element.style.animationName = '__' + window.getComputedStyle(element).animationName;
      })
      lazys.map((element) => {
        element.style.visibility = 'hidden';
        element.style.animationName = '__' + window.getComputedStyle(element).animationName;
      })
      methods.runAnimation.call(this, index);
    }
    for (let i = 0, item; item = this.items[i]; i++) {
      item.style.transform = 'translate3d(0, ' + (i < index ? '-100%' : i > index ? '100%' : '0')  + ', 0)';

      if (!this.opt.dragMode) {
        // 交给下一次宏任务延迟执行
        let timer = setTimeout(function () {
          item.classList.add('transition');
          clearTimeout(timer);
        });
      }
    }
  },
  // 注册事件
  initEvent: function () {
    // 滚轮事件
    if (this.opt.useWheel) {
      document.addEventListener('DOMMouseScroll', this.eventHandler.wheelFunc, supportsPassive ? { passive: true } : false);
      document.addEventListener('mousewheel', this.eventHandler.wheelFunc, supportsPassive ? { passive: true } : false);
    }

    // 滑动事件
    if (this.opt.useSwipe) {
      touchPoint = {
        startpoint: 0,
        endpoint: 0
      }
      this.container.addEventListener('touchstart', this.eventHandler.touchStart, supportsPassive ? { passive: true } : false);
      this.container.addEventListener('touchmove', this.eventHandler.touchMove);
      this.container.addEventListener('touchend', this.eventHandler.touchEnd, supportsPassive ? { passive: true } : false);
    }

    // 当每次滑动结束后的触发的事件
    this.container.addEventListener('transitionend', this.eventHandler.transitionEnd);
  }
}

export function installMethod(instance) {

}

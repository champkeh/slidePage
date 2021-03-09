import * as utils from './utils.js'
import {supportsPassive} from './passive.js'

const DEFAULT_OPTIONS = {
  page: 1,
  slideContainer: '.slide-container',
  slidePages: '.slide-page',
  after: function () {
  },
  before: function () {
  },
  refresh: false,
  useWheel: true,
  useSwipe: false,
  useAnimation: true,
  dragMode: false,
}

// 记录touch事件的xy
let touchPoint = {}

// 滑屏基础方法
const methods = {
  slideScroll: function (index, command) {
    const itemHeight = this.items[index].children[0].offsetHeight;
    const windowH = window.innerHeight;
    const judgeScroll = function (index) {
      const windowH = window.innerHeight;
      const isBottom = itemHeight <= this.items[index].scrollTop + windowH;
      const isTop = this.items[index].scrollTop === 0;
      this.canPrev = isTop && !isBottom;
      this.canNext = isBottom && !isTop;
      this.isScroll = !(isBottom || isTop)
    }.bind(this, index)
    if (command === 'removeListener') {
      this.items[index].removeEventListener('scroll', judgeScroll);
      return;
    }
    if ((itemHeight - windowH) > 10) {
      judgeScroll();
      if (this.direction === 'next') {
        this.items[index].scrollTop = 0;
      } else if (this.direction === 'prev') {
        this.items[index].scrollTop = itemHeight - windowH;
      }
      this.items[index].addEventListener('scroll', judgeScroll);
    } else {
      this.canPrev = true;
      this.canNext = true;
      this.isScroll = false;
    }
  },
  resetSlideForDrag: function () {
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
  resetAnimation: function (index) {
    if (this.opt.useAnimation && this.opt.refresh) {
      if (!this.items[index]) {
        return false;
      }
      const steps = Array.prototype.slice.call(this.items[index].querySelectorAll('.step'));
      const lazies = Array.prototype.slice.call(this.items[index].querySelectorAll('.lazy'));
      steps.forEach((element) => {
        element.style.visibility = 'hidden';
        element.style.animationName = '__' + window.getComputedStyle(element).animationName;
      })
      lazies.forEach((element) => {
        element.style.visibility = 'hidden';
        element.style.animationName = '__' + window.getComputedStyle(element).animationName;
      })
    }
  },
  // 自动触发动画
  runAnimation: function (index, lazy) {
    if (this.opt.useAnimation) {
      const steps = this.items[index].querySelectorAll(lazy || '.step');
      Array.prototype.slice.call(steps).forEach((element) => {
        triggerAnim(element);
      })

      function triggerAnim(element) {
        const delay = element.getAttribute('data-delay') || 100;
        const timer = setTimeout(function () {
          // 将style属性去除即可播放动画
          element.style.visibility = '';
          element.style.animationName = '';
          clearTimeout(timer);
        }, +delay);
      }
    }
  },
  initAnimation: function (items, index) {
    if (this.opt.useAnimation) {
      const steps = Array.prototype.slice.call(this.container.querySelectorAll('.step'));
      const lazies = Array.prototype.slice.call(this.container.querySelectorAll('.lazy'));
      steps.forEach((element) => {
        // 初始设置动画元素为不可见，且animationName是不可用的以控制不播放动画
        element.style.visibility = 'hidden';
        element.style.animationName = '__' + window.getComputedStyle(element).animationName;
      })
      lazies.forEach((element) => {
        element.style.visibility = 'hidden';
        element.style.animationName = '__' + window.getComputedStyle(element).animationName;
      })
      methods.runAnimation.call(this, index);
    }
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i]
      item.style.transform = 'translateY(' + (i < index ? '-100%' : i > index ? '100%' : '0') + ')';

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
      this.container.addEventListener('wheel', this.eventHandler.wheelFunc, supportsPassive ? {passive: true} : false);
    }

    // 滑动事件
    if (this.opt.useSwipe) {
      touchPoint = {
        startpoint: 0,
        endpoint: 0
      }
      this.container.addEventListener('touchstart', this.eventHandler.touchStart, supportsPassive ? {passive: true} : false);
      this.container.addEventListener('touchmove', this.eventHandler.touchMove);
      this.container.addEventListener('touchend', this.eventHandler.touchEnd, supportsPassive ? {passive: true} : false);
    }

    // 当每次滑动结束后的触发的事件
    this.container.addEventListener('transitionend', this.eventHandler.transitionEnd);
  }
}

export default class SlidePage {
  constructor(opt) {
    const {page} = utils.getQueryParam()

    this.canSlide = true;
    this.canNext = true;
    this.canPrev = true;
    this.isScroll = false;
    this.opt = utils.merge(DEFAULT_OPTIONS, page ? {page: +page} : {}, opt);

    this.page = this.opt.page;
    this.container = utils.isDOM(this.opt.slideContainer) ? this.opt.slideContainer : document.querySelector(this.opt.slideContainer);
    this.items = utils.isDOM(this.opt.slidePages) ? this.opt.slidePages : document.querySelectorAll(this.opt.slidePages);
    this.count = this.items.length;
    this.direction = '';

    this.installEvent()

    this.initMethod()
    this.slideTo(this.page);
  }

  installEvent() {
    this.eventHandler = {};

    // 鼠标滚轮是事件节流记录时间
    let prevTime = new Date().getTime();
    // 所有事件处理器
    const eventHandler = {
      wheelFunc: function (e) {
        if (this.isScroll) {
          return;
        }
        console.log('before wheel event')
        const curTime = new Date().getTime();
        const timeDiff = curTime - prevTime;
        prevTime = curTime;
        if (timeDiff <= 200) {
          return;
        }
        console.log('wheel event')
        if (e.deltaY < 0) {
          // 向上滚动
          this.canSlide && this.canPrev && this.slidePrev();
        } else if (e.deltaY > 0) {
          // 向下滚动
          this.canSlide && this.canNext && this.slideNext();
        }
      },
      touchStart: function (e) {
        if (!this.canSlide) {
          touchPoint.startpoint = -1;
        } else {
          touchPoint.startpoint = e.targetTouches[0].clientY;
        }
      },
      touchMove: function (e) {
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
            this.items[this.page - 1].style.transform = 'translate3d(0, ' + offsetY.toFixed(2) + 'px, 0)';
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
      touchEnd: function (e) {
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
      transitionEnd: function (event) {
        if (event.target === this.items[this.page-1]) {
          if (this.opt.dragMode) {
            this.items[this.page - 1].classList.remove('transition');
            this.items[this.page - 2] && this.items[this.page - 2].classList.remove('transition');
            this.items[this.page] && this.items[this.page].classList.remove('transition');
          }
          if (this.direction === 'next') {
            this.opt.after(this.page - 1, this.direction, this.page);
            this.opt.refresh && methods.resetAnimation.call(this, this.page - 2);
          } else if (this.direction === 'prev') {
            this.opt.after(this.page + 1, this.direction, this.page);
            this.opt.refresh && methods.resetAnimation.call(this, this.page);
          }
          this.canSlide = true;
          this.items[this.page-1].children[0].focus();
        }
      }
    }
    for (let eventName in eventHandler) {
      this.eventHandler[eventName] = eventHandler[eventName].bind(this);
    }
  }

  initMethod() {
    methods.initEvent.call(this);
    methods.slideScroll.call(this, this.page - 1);
    methods.initAnimation.call(this, this.items, this.page - 1);
  }

  slideNext(optimize) {
    console.log('next')
    if (this.page >= this.count) {
      return false;
    }
    console.log('confirm next')
    if (this.opt.dragMode) {
      this.items[this.page - 1].classList.add('transition');
      this.items[this.page].classList.add('transition');
    }
    this.direction = 'next';
    methods.slideScroll.call(this, this.page - 1, 'removeListener');
    methods.slideScroll.call(this, this.page);
    this.items[this.page - 1].style.transform = 'translateY(-100%)';
    this.items[this.page].style.transform = 'translateY(0)';
    this.page++;
    this.opt.before(this.page - 1, this.direction, this.page);

    if (!optimize) {
      this.canSlide = false;
      methods.runAnimation.call(this, this.page - 1);
    } else {
      methods.resetAnimation.call(this, this.page - 2);
    }
  }

  slidePrev(optimize) {
    console.log('prev')
    if (this.page <= 1) {
      return false;
    }
    console.log('confirm prev')
    if (this.opt.dragMode) {
      this.items[this.page - 2].classList.add('transition');
      this.items[this.page - 1].classList.add('transition');
    }
    this.direction = 'prev';
    methods.slideScroll.call(this, this.page - 1, 'removeListener');
    methods.slideScroll.call(this, this.page - 2);
    this.items[this.page - 2].style.transform = 'translateY(0)';
    this.items[this.page - 1].style.transform = 'translateY(100%)';
    this.page--;
    this.opt.before(this.page + 1, this.direction, this.page);
    if (!optimize) {
      this.canSlide = false;
      methods.runAnimation.call(this, this.page - 1);
    } else {
      methods.resetAnimation.call(this, this.page);
    }
  }

  slideTo(page) {
    if (page < 1 || page > this.count) {
      return
    }
    if (page === this.page) {
      return false
    }
    // 加上 this.page = 1, page = 2
    if (page > this.page) {
      // 向后滑动
      for (let i = this.page + 1; i < page; i++) {
        // 优化：当中间有一个以上的page将略过渲染
        this.slideNext('optimize');
      }
      this.slideNext();
    } else if (page < this.page) {
      // 向前滑动
      for (let i = this.page - 1; i > page; i--) {
        this.slidePrev('optimize');
      }
      this.slidePrev();
    }
  }

  slideFire(page) {
    var index = page ? page - 1 : this.page - 1;
    methods.runAnimation.call(this, index, '.lazy');
  }

  destroy() {
    if (this.opt.useAnimation) {
      // 移除所有隐藏元素
      const steps = Array.prototype.slice.call(this.container.querySelectorAll('.step'));
      const lazies = Array.prototype.slice.call(this.container.querySelectorAll('.lazy'));
      steps.forEach((element) => {
        element.style.visibility = '';
      })
      lazies.forEach((element) => {
        element.style.visibility = '';
      })
      methods.runAnimation.call(this, 0);
    }

    // 滚轮事件
    if (this.opt.useWheel) {
      this.container.removeEventListener('wheel', this.eventHandler.wheelFunc);
      this.items[this.page - 1].style.transform = 'translateY(0)';
    }

    // 滑动事件
    if (this.opt.useSwipe) {
      this.container.removeEventListener('touchstart', this.eventHandler.touchStart);
      this.container.removeEventListener('touchmove', this.eventHandler.touchMove);
      this.container.removeEventListener('touchend', this.eventHandler.touchEnd);
    }

    // 当每次滑动结束后的触发的事件
    this.container.removeEventListener('transitionend', this.eventHandler.transitionEnd);
  }

  update(pages) {
    // 回到第一屏
    this.canSlide = true;
    this.canNext = true;
    this.canPrev = true;
    const newItems = utils.isDOM(pages) ? pages : document.querySelectorAll(this.opt.slidePages);
    for (let i = 0, len = newItems.length; i < len; i++) {
      // 判断当前活动的page是否还存在则保持当前屏
      if (this.items[this.page - 1] && this.items[this.page - 1] === newItems[i]) {
        this.page = i + 1;
        break;
      }
      // 匹配到最后一个都不存在当前元素，则自动转到第一屏
      if (i === len - 1) {
        this.page = 1;
      }
    }
    this.items = newItems;
    this.count = this.items.length;
    this.slideTo(this.page);
    methods.initAnimation.call(this, this.items, this.page - 1);
    methods.slideScroll.call(this, this.page - 1);
  }
}

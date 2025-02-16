document.addEventListener('DOMContentLoaded', function() {
    // 缓存常用DOM元素
    const header = document.querySelector('.header');
    const contactForm = document.querySelector('.contact-form');
    
    // 使用节流函数优化滚动事件
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
    
    // 优化导航栏更新逻辑
    const updateNavbar = throttle(function() {
        header.classList.toggle('header-top', window.scrollY <= 0);
    }, 100);
    
    // 初始化导航栏状态
    updateNavbar();
    window.addEventListener('scroll', updateNavbar);

    // 地图交互功能
    const provinces = document.querySelectorAll('.province');
    const regionInfo = document.querySelector('.region-info');
    const regionName = document.querySelector('.region-name');
    const regionProducts = document.querySelector('.region-products');
    const mapVisual = document.querySelector('.map-visual');

    // 获取所有有数据的省份
    const provincesWithData = Array.from(provinces).filter(p => 
        p.getAttribute('data-products') && p.getAttribute('data-products').trim() !== ''
    );

    let currentIndex = 0;
    let autoplayInterval;
    let isHovering = false;

    // 修改位置计算逻辑
    function updateRegionInfoPosition(province) {
        const bbox = province.getBBox();
        const svgElement = document.querySelector('.china-map');
        const svgRect = svgElement.getBoundingClientRect();
        const mapRect = mapVisual.getBoundingClientRect();
        
        // 计算 SVG 坐标到实际像素的转换比例
        const scaleX = svgRect.width / svgElement.viewBox.baseVal.width;
        const scaleY = svgRect.height / svgElement.viewBox.baseVal.height;
        
        // 计算省份中心点在实际页面上的坐标
        const centerX = bbox.x * scaleX + bbox.width * scaleX / 2;
        const centerY = bbox.y * scaleY + bbox.height * scaleY / 2;
        
        const offset = 20; // 信息面板与省份的距离

        if (centerX < mapRect.width / 2) {
            // 在左半边，信息面板显示在右侧
            regionInfo.style.left = `${centerX + offset}px`;
            regionInfo.style.top = `${centerY}px`;
            regionInfo.style.transform = 'translateY(-50%)';
            regionInfo.classList.remove('left');
            regionInfo.classList.add('right');
        } else {
            // 在右半边，信息面板显示在左侧
            regionInfo.style.left = `${centerX - offset}px`;
            regionInfo.style.top = `${centerY}px`;
            regionInfo.style.transform = 'translate(-100%, -50%)';
            regionInfo.classList.remove('right');
            regionInfo.classList.add('left');
        }
    }

    // 修改自动轮播函数
    function autoplay() {
        if (!isHovering && provincesWithData.length > 0) {
            provinces.forEach(p => p.classList.remove('active'));
            regionInfo.classList.remove('active');
            
            const province = provincesWithData[currentIndex];
            province.classList.add('active');

            regionName.textContent = province.getAttribute('data-name');
            regionProducts.textContent = province.getAttribute('data-products');

            updateRegionInfoPosition(province);
            regionInfo.classList.add('active');

            currentIndex = (currentIndex + 1) % provincesWithData.length;
        }
    }

    // 开始自动轮播
    function startAutoplay() {
        autoplay(); // 立即显示第一个
        autoplayInterval = setInterval(autoplay, 3000); // 每3秒切换一次
    }

    // 停止自动轮播
    function stopAutoplay() {
        clearInterval(autoplayInterval);
    }

    // 修改鼠标悬浮事件
    provinces.forEach(province => {
        province.addEventListener('mousemove', function(e) {
            const hasData = this.getAttribute('data-products') && this.getAttribute('data-products').trim() !== '';
            
            if (hasData) {
                isHovering = true;
                stopAutoplay();
                
                provinces.forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                
                regionName.textContent = this.getAttribute('data-name');
                regionProducts.textContent = this.getAttribute('data-products');

                updateRegionInfoPosition(this);
                regionInfo.classList.add('active');
            }
        });

        province.addEventListener('mouseleave', function() {
            if (this.classList.contains('active')) {
                this.classList.remove('active');
            }
        });
    });

    // 修改地图区域的鼠标离开事件
    mapVisual.addEventListener('mouseleave', function() {
        provinces.forEach(p => p.classList.remove('active'));
        regionInfo.classList.remove('active');
        isHovering = false;
        startAutoplay();
    });

    // 开始自动轮播
    startAutoplay();

    // 添加平滑滚动效果
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // 获取header的高度
                const headerHeight = document.querySelector('.header').offsetHeight;
                // 计算目标位置，考虑header的高度
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // 如果是移动端，点击后关闭菜单
                const navMenu = document.querySelector('.nav-menu');
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
            }
        });
    });

    // 表单验证函数优化
    function validateForm(form) {
        const fields = {
            name: {
                value: form.name.value.trim(),
                minLength: 2,
                message: 'Please enter your name (at least 2 characters)'
            },
            email: {
                value: form.email.value.trim(),
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            message: {
                value: form.message.value.trim(),
                minLength: 10,
                message: 'Please enter a detailed message (at least 10 characters)'
            }
        };

        for (const [fieldName, field] of Object.entries(fields)) {
            if (field.minLength && field.value.length < field.minLength) {
                showToast(field.message, 'error');
                form[fieldName].focus();
                return false;
            }
            if (field.pattern && !field.pattern.test(field.value)) {
                showToast(field.message, 'error');
                form[fieldName].focus();
                return false;
            }
        }
        
        return true;
    }

    // 优化 Toast 通知功能
    const toastQueue = [];
    let isShowingToast = false;

    function showToast(message, type = 'success') {
        toastQueue.push({ message, type });
        if (!isShowingToast) {
            showNextToast();
        }
    }

    function showNextToast() {
        if (toastQueue.length === 0) {
            isShowingToast = false;
            return;
        }

        isShowingToast = true;
        const { message, type } = toastQueue.shift();
        
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => toast.classList.add('show'));
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
                showNextToast();
            }, 300);
        }, 3000);
    }

    // 优化 Loading 提示功能
    function showLoading(message = 'Sending...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        
        const content = document.createElement('div');
        content.className = 'loading-content';
        
        content.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        
        requestAnimationFrame(() => overlay.classList.add('show'));
        
        return overlay;
    }

    function hideLoading(overlay) {
        if (!overlay) return;
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
    }

    // 优化表单提交处理
    async function submitForm(form) {
        if (!validateForm(form)) return;
        
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        const loadingOverlay = showLoading('Sending your message...');
        
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        
        try {
            const formData = new URLSearchParams(new FormData(form));
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            const data = await response.json();
            
            if (data.code === '200') {
                form.reset();
                showToast(data.msg || 'Message sent successfully!', 'success');
            } else {
                showToast(data.msg || 'Failed to send message.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Network error, please check your connection.', 'error');
        } finally {
            hideLoading(loadingOverlay);
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }

    // 事件监听器
    if (contactForm) {
        contactForm.setAttribute('novalidate', true);
        contactForm.addEventListener('submit', e => {
            e.preventDefault();
            submitForm(e.target);
        });
    }
}); 
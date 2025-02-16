document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header');
    
    function updateNavbar() {
        if (window.scrollY <= 0) {
            header.classList.add('header-top');
        } else {
            header.classList.remove('header-top');
        }
    }
    
    // 初始化导航栏状态
    updateNavbar();
    
    // 监听滚动事件
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

    function sendEmail(event) {
        event.preventDefault();
        const form = event.target;
        const name = form.name.value;
        const email = form.email.value;
        const message = form.message.value;
        
        // 创建邮件内容
        const mailtoLink = `mailto:your.email@example.com?subject=Contact from Website&body=Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0AMessage:%0D%0A${encodeURIComponent(message)}`;
        
        // 打开默认邮件客户端
        window.location.href = mailtoLink;
        
        // 清空表单
        form.reset();
    }

    // 添加 Toast 通知功能
    function showToast(message, type = 'success') {
        // 移除现有的 toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 创建新的 toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // 显示 toast
        setTimeout(() => toast.classList.add('show'), 10);
        
        // 3秒后隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // 表单验证函数
    function validateForm(form) {
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const message = form.message.value.trim();
        
        if (name.length < 2) {
            showToast('Please enter your name (at least 2 characters)', 'error');
            form.name.focus();
            return false;
        }
        
        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address', 'error');
            form.email.focus();
            return false;
        }
        
        if (message.length < 10) {
            showToast('Please enter a detailed message (at least 10 characters)', 'error');
            form.message.focus();
            return false;
        }
        
        return true;
    }

    // 修改表单字段验证
    document.querySelectorAll('.contact-form input, .contact-form textarea').forEach(field => {
        // 移除浏览器默认验证提示
        field.setAttribute('novalidate', true);
        
        // 添加输入验证
        field.addEventListener('invalid', (e) => {
            e.preventDefault();
            let message = '';
            
            if (e.target.validity.valueMissing) {
                message = `Please fill in your ${e.target.name}`;
            } else if (e.target.validity.typeMismatch && e.target.type === 'email') {
                message = 'Please enter a valid email address';
            }
            
            showToast(message, 'error');
            e.target.focus();
        });
    });

    // 修改表单提交处理
    document.querySelector('.contact-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const form = e.target;
        
        // 表单验证
        if (!validateForm(form)) {
            return;
        }
        
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        // 更改按钮状态
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        
        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('Success:', data);
                // 根据返回的 JSON 数据显示对应的提示
                if (data.success) {
                    form.reset();
                    showToast(data.message || 'Message sent successfully!', 'success');
                } else {
                    showToast(data.message || 'Failed to send message.', 'error');
                }
            } else {
                // 处理 HTTP 错误
                showToast(data.message || 'Server error, please try again later.', 'error');
            }
        } catch (error) {
            // 处理网络错误或 JSON 解析错误
            console.error('Error:', error);
            showToast('Network error, please check your connection.', 'error');
        } finally {
            // 恢复按钮状态
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}); 
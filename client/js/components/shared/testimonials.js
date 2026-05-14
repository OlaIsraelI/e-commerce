export const initTestimonialSlider = () => {
  const testimonialSlider = document.querySelector(".testimonial-slider");

  if (!testimonialSlider) {
    return;
  }

  const slides = Array.from(
    testimonialSlider.querySelectorAll(".testimonial-slide"),
  );
  const prevButton = testimonialSlider.querySelector(".testimonial-prev");
  const nextButton = testimonialSlider.querySelector(".testimonial-next");
  const dots = Array.from(
    document.querySelectorAll(".testimonial-dots button"),
  );
  let activeIndex = 0;
  let autoSlideTimer;

  const showSlide = (index) => {
    if (!slides.length) {
      return;
    }

    activeIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-selected", String(isActive));
    });
  };

  const startAutoSlide = () => {
    stopAutoSlide();
    autoSlideTimer = window.setInterval(() => {
      showSlide(activeIndex + 1);
    }, 4500);
  };

  const stopAutoSlide = () => {
    window.clearInterval(autoSlideTimer);
  };

  prevButton?.addEventListener("click", () => {
    showSlide(activeIndex - 1);
  });

  nextButton?.addEventListener("click", () => {
    showSlide(activeIndex + 1);
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
    });
  });

  testimonialSlider.addEventListener("mouseenter", stopAutoSlide);
  testimonialSlider.addEventListener("mouseleave", startAutoSlide);
  testimonialSlider.addEventListener("focusin", stopAutoSlide);
  testimonialSlider.addEventListener("focusout", startAutoSlide);

  showSlide(0);
  startAutoSlide();
};

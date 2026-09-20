# Эффект спойлера для изображения на CSS + JavaScript

Ниже — готовая инструкция, как добавить к изображению эффект спойлера: изображение размывается, поверх него отображаются анимированные точки, а по клику спойлер раскрывается.

## 1. Добавьте класс `spoiler` к изображению

Исходная разметка:

```html
<figure class="post__image post__image--center">
  <img
    loading="lazy"
    src="image.jpg"
    width="1070"
    height="839"
    alt=""
  >
</figure>
```

Чтобы включить эффект спойлера, достаточно добавить к `figure` класс `spoiler`:

```html
<figure class="spoiler post__image post__image--center">
  <img
    loading="lazy"
    src="image.jpg"
    width="1070"
    height="839"
    alt=""
  >
</figure>
```

Таким образом один и тот же скрипт можно использовать для любого количества изображений: эффект будет применяться ко всем элементам с классом `.spoiler`.

---

## 2. JavaScript

Скрипт:

1. находит все элементы `.spoiler`;
2. добавляет поверх изображения слой размытия;
3. создаёт контейнер с анимированными точками;
4. генерирует точки в случайных позициях;
5. по клику раскрывает изображение.

```js
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.spoiler').forEach((spoiler) => {
    // Слой размытия
    const blurBlock = document.createElement('div');
    blurBlock.classList.add('blur-block');
    spoiler.appendChild(blurBlock);

    // Контейнер для точек
    const dotsContainer = document.createElement('div');
    dotsContainer.classList.add('dots');
    spoiler.appendChild(dotsContainer);

    // Количество анимированных точек
    const numberOfDots = 350;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < numberOfDots; i++) {
      const dot = document.createElement('div');
      dot.classList.add('dot');

      // Случайное положение
      dot.style.top = `${Math.random() * 100}%`;
      dot.style.left = `${Math.random() * 100}%`;

      // Немного различаем размер точек
      const size = 1 + Math.random() * 3;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;

      // Случайная задержка и скорость анимации
      dot.style.animationDelay = `${Math.random() * 2}s`;
      dot.style.animationDuration = `${1.5 + Math.random() * 2.5}s`;

      fragment.appendChild(dot);
    }

    dotsContainer.appendChild(fragment);

    // По клику раскрываем спойлер
    spoiler.addEventListener('click', () => {
      spoiler.classList.add('spoiler--open');
    });
  });
});
```

Количество точек можно изменить здесь:

```js
const numberOfDots = 350;
```

Например, для более лёгкого эффекта:

```js
const numberOfDots = 150;
```

---

## 3. CSS

### Базовые стили спойлера

```css
.spoiler {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.spoiler img {
  display: block;
  width: 100%;
  height: auto;
}
```

---

### Размытие изображения

Поверх изображения добавляется `.blur-block`.

```css
.spoiler .blur-block {
  position: absolute;
  inset: 0;
  z-index: 2;

  background: rgba(0, 0, 0, 0.53);
  backdrop-filter: blur(35px) brightness(1.1);
  -webkit-backdrop-filter: blur(35px) brightness(1.1);

  border-radius: inherit;

  opacity: 1;
  transition: opacity 0.3s ease;
}
```

Если нужен более сильный или более слабый blur, измените:

```css
blur(35px)
```

---

### Контейнер с точками

```css
.spoiler .dots {
  position: absolute;
  inset: 0;
  z-index: 3;

  overflow: hidden;
  pointer-events: none;

  opacity: 1;
  transition: opacity 0.3s ease;
}
```

---

### Сами точки

```css
.spoiler .dot {
  position: absolute;

  width: 2px;
  height: 2px;

  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);

  animation-name: move-dot;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;

  will-change: transform, opacity;
}
```

---

### Анимация точек

```css
@keyframes move-dot {
  0% {
    transform: translate3d(-4px, -4px, 0) scale(0.8);
    opacity: 0.25;
  }

  50% {
    transform: translate3d(4px, 2px, 0) scale(1.2);
    opacity: 1;
  }

  100% {
    transform: translate3d(-2px, 5px, 0) scale(0.9);
    opacity: 0.45;
  }
}
```

---

## 4. Скрытие эффекта после клика

JavaScript добавляет к контейнеру класс:

```text
spoiler--open
```

Добавьте CSS:

```css
.spoiler.spoiler--open {
  cursor: default;
}

.spoiler.spoiler--open .blur-block,
.spoiler.spoiler--open .dots {
  opacity: 0;
  pointer-events: none;
}
```

Если после раскрытия слои больше вообще не нужны, их можно скрывать после окончания transition:

```css
.spoiler.spoiler--open .blur-block,
.spoiler.spoiler--open .dots {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.3s ease,
    visibility 0s linear 0.3s;
}
```

---

## 5. Полный CSS одним блоком

```css
.spoiler {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.spoiler img {
  display: block;
  width: 100%;
  height: auto;
}

.spoiler .blur-block {
  position: absolute;
  inset: 0;
  z-index: 2;

  background: rgba(0, 0, 0, 0.53);
  backdrop-filter: blur(35px) brightness(1.1);
  -webkit-backdrop-filter: blur(35px) brightness(1.1);

  border-radius: inherit;

  opacity: 1;
  transition: opacity 0.3s ease;
}

.spoiler .dots {
  position: absolute;
  inset: 0;
  z-index: 3;

  overflow: hidden;
  pointer-events: none;

  opacity: 1;
  transition: opacity 0.3s ease;
}

.spoiler .dot {
  position: absolute;

  width: 2px;
  height: 2px;

  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);

  animation-name: move-dot;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;

  will-change: transform, opacity;
}

.spoiler.spoiler--open {
  cursor: default;
}

.spoiler.spoiler--open .blur-block,
.spoiler.spoiler--open .dots {
  opacity: 0;
  pointer-events: none;
}

@keyframes move-dot {
  0% {
    transform: translate3d(-4px, -4px, 0) scale(0.8);
    opacity: 0.25;
  }

  50% {
    transform: translate3d(4px, 2px, 0) scale(1.2);
    opacity: 1;
  }

  100% {
    transform: translate3d(-2px, 5px, 0) scale(0.9);
    opacity: 0.45;
  }
}
```

---

## 6. Полный JavaScript одним блоком

```js
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.spoiler').forEach((spoiler) => {
    const blurBlock = document.createElement('div');
    blurBlock.classList.add('blur-block');
    spoiler.appendChild(blurBlock);

    const dotsContainer = document.createElement('div');
    dotsContainer.classList.add('dots');
    spoiler.appendChild(dotsContainer);

    const numberOfDots = 350;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < numberOfDots; i++) {
      const dot = document.createElement('div');
      dot.classList.add('dot');

      dot.style.top = `${Math.random() * 100}%`;
      dot.style.left = `${Math.random() * 100}%`;

      const size = 1 + Math.random() * 3;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;

      dot.style.animationDelay = `${Math.random() * 2}s`;
      dot.style.animationDuration = `${1.5 + Math.random() * 2.5}s`;

      fragment.appendChild(dot);
    }

    dotsContainer.appendChild(fragment);

    spoiler.addEventListener('click', () => {
      spoiler.classList.add('spoiler--open');
    });
  });
});
```

---

## 7. Минимальный пример

```html
<figure class="spoiler">
  <img
    src="image.jpg"
    alt="Изображение со спойлером"
    width="1200"
    height="800"
  >
</figure>
```

Подключите CSS и JavaScript из разделов выше — дополнительная HTML-разметка для blur и точек не требуется: скрипт создаст её автоматически.

---

## 8. Повторное скрытие по клику

Если нужно, чтобы повторный клик снова включал спойлер, замените:

```js
spoiler.classList.add('spoiler--open');
```

на:

```js
spoiler.classList.toggle('spoiler--open');
```

---

## 9. Производительность

350 DOM-элементов на одно изображение обычно допустимы для единичного спойлера, но если на странице их много, количество точек лучше уменьшить:

```js
const numberOfDots = 100;
```

или:

```js
const numberOfDots = 150;
```

Также можно отключать анимацию для пользователей, предпочитающих уменьшенное движение:

```css
@media (prefers-reduced-motion: reduce) {
  .spoiler .dot {
    animation: none;
  }
}
```

---

## Итог

Для добавления эффекта к изображению достаточно:

1. добавить класс `spoiler` к контейнеру изображения;
2. подключить CSS;
3. подключить JavaScript.

Пример:

```html
<figure class="spoiler post__image post__image--center">
  <img src="image.jpg" alt="">
</figure>
```

После загрузки страницы скрипт автоматически создаст blur и анимированные точки. По клику изображение раскроется.

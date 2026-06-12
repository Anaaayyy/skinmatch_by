'use client';

import { useState } from 'react';
import Link from 'next/link';

interface HelpSection {
  id: string;
  title: string;
  content: string;
}

const helpSections: HelpSection[] = [
  {
    id: 'about',
    title: 'О проекте',
    content: `SkinMatch BY — это платформа для подбора белорусской косметики с учётом индивидуальных особенностей кожи.

Проект помогает:
• Определить тип кожи с помощью анкеты
• Подобрать уходовые средства под конкретные проблемы
• Сравнивать товары между собой
• Сохранять избранное и составлять рутины ухода
• Общаться на форуме с другими пользователями

Все товары основаны на реальных данных белорусских производителей косметики.`,
  },
  {
    id: 'questionnaire',
    title: 'Анкета и определение типа кожи',
    content: `Анкета — это первый шаг к персонализированному подбору косметики. Она состоит из 10 вопросов о состоянии вашей кожи.

Как пройти анкету:
1. Перейдите в раздел «Анкета» через главное меню
2. Отвечайте на вопросы, выбирая наиболее подходящий вариант
3. После ответа на все вопросы выберите беспокоящие вас проблемы
4. Укажите возрастной диапазон и возможные аллергии
5. Нажмите «Завершить»

После прохождения анкеты система автоматически определит ваш тип кожи и будет показывать процент совпадения для каждого товара в каталоге.

Результаты анкеты сохраняются в личном кабинете. Вы можете в любой момент отредактировать их или пройти анкету заново.`,
  },
  {
    id: 'catalog',
    title: 'Каталог и поиск товаров',
    content: `Каталог содержит все доступные товары белорусских производителей косметики.

Возможности каталога:
• Поиск по названию товара
• Фильтрация по брендам и категориям
• Сортировка по совпадению с профилем, новизне и рейтингу
• Отображение процента совпадения с вашим типом кожи
• Добавление в избранное прямо из каталога

Как подбираются товары:
Если вы прошли анкету, каталог автоматически показывает товары, подходящие вашему типу кожи. Товары с пометкой «все типы кожи» показываются всегда. Процент совпадения рассчитывается на основе совместимости типа кожи и решаемых проблем.`,
  },
  {
    id: 'routine',
    title: 'Подбор рутины ухода',
    content: `Рутина ухода — это последовательность средств для ежедневного ухода за кожей.

Как создать рутину:
1. Перейдите в раздел «Подбор рутины»
2. Укажите цель (увлажнение, антивозрастной уход и т.д.)
3. Выберите предпочтительное время применения (утро/вечер)
4. Нажмите «Подобрать»

Система автоматически подберёт средства для каждого этапа ухода:
• Очищение — гель или пенка для умывания
• Тонизирование — тоник
• Сыворотка — активный уход
• Увлажнение — крем
• SPF защита — солнцезащитное средство

Созданные рутины сохраняются в личном кабинете. Вы можете просматривать их в любой момент.`,
  },
  {
    id: 'comparison',
    title: 'Сравнение товаров',
    content: `Сравнение позволяет сопоставить до 4 товаров в каждой категории.

Как сравнивать товары:
1. Откройте карточку товара
2. Нажмите «Сравнить»
3. Перейдите в раздел «Сравнение»

В таблице сравнения отображаются:
• Процент совпадения с вашим профилем кожи
• Рейтинг
• Тип кожи
• Объём
• Решаемые проблемы

Лимиты:
• До 4 товаров в одной категории
• Если категория заполнена, удалите один товар перед добавлением нового`,
  },
  {
    id: 'favorites',
    title: 'Избранное',
    content: `Избранное — это список товаров, которые вас заинтересовали.

Как добавить в избранное:
• Нажмите на сердечко в карточке товара в каталоге
• Или нажмите «В избранное» на странице товара

Просмотреть избранное можно через иконку сердечка в верхнем меню.`,
  },
  {
    id: 'forum',
    title: 'Форум',
    content: `Форум — это место для обсуждения ухода за кожей и обмена опытом.

Структура форума:
• Категории — разделы по темам (уход, проблемная кожа и т.д.)
• Темы — обсуждения внутри категорий
• Сообщения — ответы в темах

Как создать тему:
1. Войдите в нужную категорию
2. Нажмите «+ Тема»
3. Введите заголовок и текст
4. При необходимости добавьте изображения (до 4)
5. Нажмите «Опубликовать»

Как ответить на сообщение:
1. Откройте тему
2. Нажмите «Ответить» под нужным сообщением
3. Напишите текст ответа
4. Нажмите «Отправить»

В ответах на сообщения показывается связь в виде линии, чтобы было понятно кто кому отвечает. Вы можете удалять свои сообщения — при этом удалятся и все ответы на них.

Запрещено публиковать оскорбительные, непристойные и запрещённые материалы. Все сообщения проходят автоматическую проверку.`,
  },
  {
    id: 'reviews',
    title: 'Отзывы',
    content: `Отзывы помогают другим пользователям выбрать подходящий товар.

Как оставить отзыв:
1. Откройте страницу товара
2. Прокрутите до раздела «Отзывы»
3. Поставьте оценку от 1 до 5 звёзд
4. Напишите текст отзыва
5. При желании добавьте фотографии (до 5)
6. Нажмите «Отправить отзыв»

Отзывы можно фильтровать: все отзывы или только с фото. Средний рейтинг товара отображается в виде шкалы с распределением оценок.

Запрещено использовать оскорбительные и запрещённые выражения. Все отзывы проходят автоматическую модерацию.`,
  },
  {
    id: 'profile',
    title: 'Личный кабинет',
    content: `В личном кабинете вы можете управлять своими данными и настройками.

Разделы личного кабинета:
• Параметры кожи — просмотр и редактирование типа кожи, проблем, возраста и аллергий
• Аккаунт — изменение имени пользователя, загрузка аватара, смена пароля
• Мои рутины — просмотр сохранённых рутин ухода

Как изменить аватар:
1. Перейдите в раздел «Аккаунт»
2. Нажмите «Загрузить фото»
3. Выберите изображение (JPG, PNG до 2 МБ)
4. Нажмите «Сохранить изменения»

Как сменить пароль:
1. Перейдите в раздел «Аккаунт»
2. В блоке «Сменить пароль» введите текущий пароль
3. Введите новый пароль (минимум 6 символов)
4. Подтвердите новый пароль
5. Нажмите «Изменить пароль»`,
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const filteredSections = searchQuery.trim()
    ? helpSections.filter(
        s =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : helpSections;

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px 80px' }}>
      <style>{`
        .help-search {
          width: 100%;
          padding: 14px 20px;
          border: 2px solid #f3f4f6;
          border-radius: 14px;
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
          margin-bottom: 32px;
        }
        .help-search:focus {
          border-color: #fbcfe8;
        }
        .help-section {
          background: white;
          border: 1px solid #f3f4f6;
          border-radius: 14px;
          margin-bottom: 12px;
          overflow: hidden;
        }
        .help-section-header {
          padding: 16px 22px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          transition: background 0.15s;
          user-select: none;
        }
        .help-section-header:hover {
          background: #fafafa;
        }
        .help-section-arrow {
          font-size: 12px;
          color: #9ca3af;
          transition: transform 0.2s;
        }
        .help-section-arrow.open {
          transform: rotate(180deg);
        }
        .help-section-body {
          padding: 0 22px 20px;
          font-size: 14px;
          line-height: 1.7;
          color: #4b5563;
          white-space: pre-line;
        }
        .help-nav {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 28px;
        }
        .help-nav-item {
          padding: 6px 14px;
          border: 1px solid #f3f4f6;
          border-radius: 20px;
          font-size: 13px;
          color: #6b7280;
          cursor: pointer;
          background: white;
          transition: all 0.15s;
        }
        .help-nav-item:hover {
          border-color: #fbcfe8;
          color: #db2777;
        }
        .help-nav-item.active {
          background: #fdf2f8;
          border-color: #db2777;
          color: #db2777;
          font-weight: 500;
        }
        .help-no-results {
          text-align: center;
          padding: 40px;
          color: #9ca3af;
          font-size: 14px;
        }
        @media (max-width: 640px) {
          .help-section-header {
            font-size: 14px;
            padding: 14px 16px;
          }
          .help-section-body {
            padding: 0 16px 16px;
            font-size: 13px;
          }
        }
      `}</style>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', margin: '0 0 8px 0' }}>Справка</h1>
      <p style={{ fontSize: 15, color: '#9ca3af', margin: '0 0 28px 0' }}>
        Всё о функциях и возможностях SkinMatch BY
      </p>

      <input
        type="text"
        className="help-search"
        placeholder="Поиск по справке..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />

      {!searchQuery && (
        <div className="help-nav">
          {helpSections.map(s => (
            <button
              key={s.id}
              className={`help-nav-item ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => toggleSection(s.id)}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      <div>
        {filteredSections.length === 0 ? (
          <div className="help-no-results">Ничего не найдено по запросу «{searchQuery}»</div>
        ) : (
          filteredSections.map(s => (
            <div key={s.id} className="help-section">
              <div className="help-section-header" onClick={() => toggleSection(s.id)}>
                {s.title}
                <span className={`help-section-arrow ${activeSection === s.id ? 'open' : ''}`}>▼</span>
              </div>
              {activeSection === s.id && <div className="help-section-body">{s.content}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
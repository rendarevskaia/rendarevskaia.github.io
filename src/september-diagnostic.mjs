import { escapeHtml } from "./utils.mjs";

const questions = [
  {
    step: 1,
    id: "q1",
    title: "Если сохранить текущую динамику до конца года, насколько вероятно получить запланированный результат?",
    options: [
      [0, "Текущая динамика соответствует плану или опережает его."],
      [1, "Есть небольшой разрыв, который можно закрыть уже запущенными действиями."],
      [2, "Без дополнительных решений результат будет заметно ниже плана."],
      [3, "При текущей динамике плановый результат недостижим."],
    ],
  },
  {
    step: 1,
    id: "q2",
    title: "Насколько план на 2026 год остаётся рабочей основой для решений?",
    note: "Так мы отделяем ухудшение бизнеса от плана, который потерял актуальность или изначально был построен на слишком оптимистичных предпосылках.",
    options: [
      [0, "Предпосылки проверены, план обновляется и остаётся достижимым."],
      [1, "Некоторые предпосылки изменились, но разрыв можно закрыть понятными действиями."],
      [2, "Заметная часть плана уже не подтверждается текущими данными."],
      [3, "План требует пересборки: сейчас это скорее желаемая цифра, чем рабочий расчёт."],
    ],
  },
  {
    step: 1,
    id: "q3",
    type: "number-pair",
    title: "Как должна была и как фактически выполнилась выручка к 31 августа?",
    note: "Укажите долю годового плана с учётом сезонности. Мы сравним факт не с универсальной нормой, а с вашей плановой траекторией.",
    fields: [
      ["q3_expected", "По плану к этой дате"],
      ["q3_actual", "Выполнено фактически"],
    ],
    unknownLabel: "Не могу сопоставить: нет сезонной плановой траектории или актуального факта.",
  },
  {
    step: 1,
    id: "q4",
    title: "Как операционная прибыль с начала года соотносится с планом на этот период?",
    options: [
      [0, "На уровне плана или выше."],
      [1, "Ниже плана не более чем на 10%."],
      [2, "Ниже плана на 11–25%."],
      [3, "Ниже плана более чем на 25%."],
      ["unknown", "Не могу сопоставить: такого плана или расчёта сейчас нет."],
    ],
  },
  {
    step: 2,
    id: "q5",
    title: "Насколько конкретно разложена выручка, необходимая до конца года?",
    options: [
      [0, "По действующим клиентам, сделкам, каналам и продуктам; суммы и сроки можно проверить."],
      [1, "Основные источники понятны, но часть суммы ещё держится на предположениях."],
      [2, "Есть целевая сумма и несколько идей, но нет проверяемого пути к ней."],
      [3, "Есть только сумма, которую хотелось бы получить."],
    ],
  },
  {
    step: 2,
    id: "q6",
    title: "Какая доля необходимой до конца года выручки уже подтверждается фактами?",
    note: "Учитывайте действующие договоры, ожидаемые повторные заказы и взвешенную воронку с учётом вашей фактической конверсии.",
    options: [[0, "Более 75%."], [1, "50–75%."], [2, "25–49%."], [3, "Менее 25%."], ["unknown", "Не могу оценить по имеющимся данным."]],
  },
  {
    step: 2,
    id: "q7",
    title: "Если продажи ниже необходимого уровня, где возникает первый заметный разрыв?",
    options: [
      [0, "Разрыва нет: продажи соответствуют необходимому уровню или превышают его."],
      [1, "Квалифицированных обращений достаточно, но теряется конверсия, чек или скорость сделки."],
      [2, "Не хватает стабильного потока квалифицированных потенциальных клиентов."],
      [3, "Нет проверенного ответа, откуда должен прийти необходимый объём продаж."],
      ["unknown", "Не могу определить: воронка не даёт такой детализации."],
    ],
  },
  {
    step: 3,
    id: "q8",
    title: "Насколько регулярно вы видите прибыльность отдельных продуктов, направлений или клиентских сегментов?",
    options: [
      [0, "Показатели рассчитаны по единой методике и регулярно обновляются."],
      [1, "Основные источники прибыли видны, но часть затрат или направлений пока распределяется приблизительно."],
      [2, "Выручка по направлениям видна, а их реальная прибыльность — лишь частично."],
      [3, "Ориентируемся в основном на общую прибыль и остаток денег."],
      ["unknown", "Таких данных сейчас нет."],
    ],
  },
  {
    step: 3,
    id: "q9",
    title: "Можно ли посчитать, сколько дополнительной прибыли принесут следующие 20% выручки?",
    options: [
      [0, "Да: понятно, сколько останется от дополнительных продаж после связанных с ними расходов."],
      [1, "Приблизительно: основные переменные затраты известны, но не все последствия роста учтены."],
      [2, "Только очень грубо: рост потребует затрат, размер которых пока не посчитан."],
      [3, "Расчёт или прошлый опыт показывает, что дополнительная выручка почти не увеличит прибыль."],
      ["unknown", "Такой расчёт сейчас невозможно сделать по имеющимся данным."],
    ],
  },
  {
    step: 3,
    id: "q10",
    title: "Насколько предсказуемо прибыль превращается в деньги на счёте?",
    options: [
      [0, "Есть связанный прогноз прибыли, оборотного капитала и денежных остатков до конца года."],
      [1, "Основные движения понятны, но отдельные кассовые разрывы возникают неожиданно."],
      [2, "Денег регулярно оказывается меньше, чем можно ожидать по прибыли."],
      [3, "Платежи и решения в основном определяются текущим остатком на счёте."],
      ["unknown", "Связь прибыли и денежного потока сейчас не отслеживается."],
    ],
  },
  {
    step: 4,
    id: "q11",
    title: "На чём основана уверенность, что компания выполнит дополнительный объём заказов?",
    options: [
      [0, "На данных о загрузке, производительности и понятном плане добавления мощности."],
      [1, "Основные ресурсы посчитаны, но по отдельным процессам остаются риски."],
      [2, "На опыте команды и предположении, что при необходимости справимся."],
      [3, "Оснований мало: текущий объём уже создаёт перегрузку или регулярные сбои."],
      ["unknown", "Загрузка и доступная мощность не измеряются."],
    ],
  },
  {
    step: 4,
    id: "q12",
    title: "Что показывают фактические сроки, качество и себестоимость выполнения заказов?",
    options: [
      [0, "Показатели устойчивы; существенной системной потери после продажи не видно."],
      [1, "Есть локальные отклонения, но они не влияют заметно на общий результат."],
      [2, "Регулярно отклоняются сроки, качество, загрузка или себестоимость."],
      [3, "Объём продаж уже превышает способность выполнять обязательства без потерь."],
      ["unknown", "Эти показатели не собраны в единую картину."],
    ],
  },
  {
    step: 5,
    id: "q13",
    title: "Если руководители независимо назовут три главных результата до конца года, насколько совпадут их ответы?",
    options: [
      [0, "Совпадут и по приоритетам, и по измеримому результату."],
      [1, "Главный приоритет совпадёт, но критерии результата разойдутся."],
      [2, "Совпадёт только часть приоритетов."],
      [3, "Получатся разные версии того, что сейчас главное."],
      ["unknown", "Такую сверку мы не проводили и предсказать результат не могу."],
    ],
  },
  {
    step: 5,
    id: "q14",
    title: "Что происходит, когда возникает значимое отклонение от плана?",
    options: [
      [0, "Человек, отвечающий за показатель, сам принимает решение в согласованный срок; собственник подключается только там, где нужно изменить цель, бюджет или допустимый риск."],
      [1, "Большинство вопросов ответственные решают сами; отдельные решения ждут согласования с другим руководителем или собственником."],
      [2, "Ответственность часто приходится уточнять, а решения заметно задерживаются или уходят к собственнику."],
      [3, "Без участия собственника значимые вопросы часто зависают."],
      ["unknown", "Не отслеживаем, где и на какой срок зависают решения."],
    ],
  },
  {
    step: 6,
    id: "q15",
    title: "Если собственник на четыре недели выйдет именно из операционного управления, что произойдёт?",
    options: [
      [0, "Текущая работа продолжится; решения о целях, капитале и ключевых рисках можно заранее вынести в отдельный разговор с собственником."],
      [1, "Отдельные функции замедлятся, но критичного ущерба результату не будет."],
      [2, "Несколько важных процессов и решений заметно просядут."],
      [3, "Работа компании начнёт останавливаться или такой сценарий сейчас невозможно организовать."],
      ["unknown", "Не было даже короткого периода, по которому это можно оценить."],
    ],
  },
];

const steps = [
  ["Цель и траектория", "Есть ли разрыв между текущим движением бизнеса и результатом, который вы хотите получить?"],
  ["Спрос и продажи", "Понятно ли, откуда должна прийти выручка оставшейся части года?"],
  ["Экономика модели", "Превращается ли дополнительная выручка в прибыль и деньги?"],
  ["Выполнение заказов", "Может ли компания выполнить больший объём в срок, без роста переделок и себестоимости?"],
  ["Управление", "Одинаково ли руководители понимают приоритеты и могут ли принимать решения без ожидания собственника?"],
  ["Роль собственника", "Не заканчивается ли система управления в точке вашего личного участия?"],
];

function renderQuestion(question, number) {
  if (question.type === "number-pair") {
    return `<fieldset class="diagnostic-question diagnostic-question-numbers" data-question="${question.id}">
      <legend class="diagnostic-question-title"><span>${number}</span>${escapeHtml(question.title)}</legend>
      ${question.note ? `<p class="diagnostic-question-note">${escapeHtml(question.note)}</p>` : ""}
      <div class="diagnostic-number-pair">${question.fields.map(([id, label]) => `<label><span>${escapeHtml(label)}</span><span class="diagnostic-number"><input id="${id}" name="${id}" type="number" min="0" max="200" step="0.1" inputmode="decimal" required><span>%</span></span></label>`).join("")}</div>
      <label class="diagnostic-unknown-choice"><input type="checkbox" name="${question.id}_unknown" value="1"><span>${escapeHtml(question.unknownLabel)}</span></label>
    </fieldset>`;
  }
  if (question.type === "number") {
    return `<div class="diagnostic-question" data-question="${question.id}">
      <label class="diagnostic-question-title" for="${question.id}"><span>${number}</span>${escapeHtml(question.title)}</label>
      ${question.note ? `<p class="diagnostic-question-note">${escapeHtml(question.note)}</p>` : ""}
      <div class="diagnostic-number"><input id="${question.id}" name="${question.id}" type="number" min="0" max="200" step="0.1" inputmode="decimal" required><span>%</span></div>
    </div>`;
  }

  return `<fieldset class="diagnostic-question" data-question="${question.id}">
    <legend class="diagnostic-question-title"><span>${number}</span>${escapeHtml(question.title)}</legend>
    ${question.note ? `<p class="diagnostic-question-note">${escapeHtml(question.note)}</p>` : ""}
    <div class="diagnostic-options">${question.options.map(([value, label], index) => `<label><input type="radio" name="${question.id}" value="${value}" required><span class="diagnostic-option-letter">${String.fromCharCode(1040 + index)}</span><span>${escapeHtml(label)}</span></label>`).join("")}</div>
  </fieldset>`;
}

export function renderSeptemberDiagnostic({ href, contact }) {
  const stepMarkup = steps.map(([title, description], index) => {
    const step = index + 1;
    const stepQuestions = questions.filter((question) => question.step === step);
    return `<section class="diagnostic-step" data-step="${step}"${step === 1 ? "" : " hidden"}>
      <header class="diagnostic-step-header"><p class="section-kicker">Блок ${step} из ${steps.length}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></header>
      ${stepQuestions.map((question) => renderQuestion(question, questions.indexOf(question) + 1)).join("")}
      <div class="diagnostic-controls">${step > 1 ? '<button class="button button-secondary" type="button" data-action="previous">Назад</button>' : ""}<button class="button button-primary" type="button" data-action="${step === steps.length ? "confirmation" : "next"}">${step === steps.length ? "Уточнить результат" : "Продолжить"}</button></div>
    </section>`;
  }).join("");

  return `<section class="diagnostic-hero"><div class="shell diagnostic-hero-grid">
    <div><p class="eyebrow">Диагностика · сентябрь 2026</p><h1>Что сейчас ограничивает результат вашего бизнеса до конца года</h1><p class="diagnostic-hero-lead">Пятнадцать базовых вопросов в шести блоках и четыре уточняющих вопроса по двум наиболее заметным направлениям.</p><a class="button button-primary" href="#diagnostic">Начать диагностику</a></div>
    <aside class="diagnostic-summary"><p class="section-kicker">10–12 минут</p><h2>На выходе</h2><ul><li>три ваших ответа, на которых основан вывод;</li><li>первое направление для проверки;</li><li>вторая возможная версия;</li><li>конкретный факт, который поможет их различить;</li><li>три понятных действия.</li></ul><p>Ответы обрабатываются только в вашем браузере и никуда не отправляются.</p></aside>
  </div></section>
  <section class="shell diagnostic-intro" aria-labelledby="diagnostic-method-title"><div><p class="section-kicker">Логика</p><h2 id="diagnostic-method-title">Не тип бизнеса, а место ограничения</h2></div><p>Диагностика сначала проверяет разрыв между планом и фактом, затем разбирает продажи, экономику, выполнение заказов, управление и зависимость текущей работы от собственника. Самый высокий балл не объявляется причиной автоматически: вывод показывает, какой факт нужно проверить первым.</p></section>
  <section class="diagnostic-workspace" id="diagnostic"><div class="shell diagnostic-shell">
    <div class="diagnostic-progress" aria-label="Прогресс диагностики"><div><span id="diagnostic-progress-label">Блок 1 из 6</span><span id="diagnostic-progress-percent">14%</span></div><div class="diagnostic-progress-track"><span id="diagnostic-progress-bar"></span></div></div>
    <form id="september-diagnostic-form" novalidate>${stepMarkup}<section class="diagnostic-confirmation" id="diagnostic-confirmation" hidden><header class="diagnostic-step-header"><p class="section-kicker">Уточнение результата</p><h2>Проверим два наиболее заметных направления</h2><p>Следующие четыре вопроса зависят от ваших предыдущих ответов. Они нужны, чтобы не принять первый заметный симптом за причину.</p></header><div id="diagnostic-confirmation-questions"></div><div class="diagnostic-controls"><button class="button button-secondary" type="button" data-action="confirmation-back">Назад</button><button class="button button-primary" type="submit">Получить разбор</button></div></section><p class="diagnostic-error" id="diagnostic-error" role="alert" aria-live="polite"></p></form>
    <section class="diagnostic-result" id="diagnostic-result" hidden aria-live="polite" tabindex="-1">
      <header class="diagnostic-result-header"><p class="section-kicker">Ваша точка сентября</p><h2 id="result-title"></h2><p id="result-lead"></p></header>
      <dl class="diagnostic-result-facts"><div><dt>Сначала проверить</dt><dd id="result-primary"></dd></div><div><dt>Проверить следом</dt><dd id="result-secondary"></dd></div><div><dt>Статус вывода</dt><dd id="result-profile"></dd></div></dl>
      <div class="diagnostic-result-grid"><section><div class="diagnostic-evidence"><p class="section-kicker">Вы ответили, что</p><ul id="result-evidence"></ul></div><div class="diagnostic-meaning"><p class="section-kicker">Что это может означать</p><div id="result-interpretation"></div></div></section><section><p class="section-kicker">Пять направлений проверки</p><p class="diagnostic-signals-note">Полосы не являются измерением здоровья бизнеса. Они только показывают, где в ваших ответах больше признаков проблемы и где не хватает данных.</p><div class="diagnostic-signals" id="result-signals"></div></section></div>
      <section class="diagnostic-actions"><p class="section-kicker">Следующий шаг</p><h3>Что проверить на фактах</h3><ol id="result-actions"></ol></section>
      <div class="diagnostic-result-grid diagnostic-result-notes"><section><p class="section-kicker">Пока не стоит заключать</p><p id="result-warning"></p></section><section><p class="section-kicker">Вопрос, который поможет различить причины</p><p id="result-question"></p></section></div>
      <section class="diagnostic-result-cta"><p class="section-kicker">Если хотите разобраться глубже</p><p id="result-cta-copy"></p><div class="diagnostic-result-buttons"><button class="button button-secondary" type="button" id="diagnostic-print">Подготовить PDF</button><a class="button button-primary" href="${escapeHtml(contact)}">Разобрать мою ситуацию с Еленой</a><button class="text-button" type="button" id="diagnostic-restart">Пройти заново</button></div></section>
      <p class="diagnostic-pdf-status" id="diagnostic-pdf-status" aria-live="polite"></p>
      <p class="diagnostic-disclaimer">Это предварительный разбор по вашим ответам. Он показывает, какую причинную связь стоит проверить, но не заменяет финансовую и управленческую диагностику компании.</p>
    </section>
  </div></section>
  <script src="${href("/diagnostics/september-2026.js")}" defer></script>`;
}

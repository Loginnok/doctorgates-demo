const form = document.querySelector("#repair-form");
const gate = document.querySelector("#gate");
const phone = document.querySelector("#phone");
const phoneError = document.querySelector("#phone-error");
const problem = form.elements.problem;
const photoInput = document.querySelector("#photos");
const photoStatus = document.querySelector("#photo-status");
const photoList = document.querySelector("#photo-list");
const result = document.querySelector("#result");
const resultTitle = document.querySelector("#result-title");
const summary = document.querySelector("#summary");
const attachments = [];
const maxPhotoBytes = 10 * 1024 * 1024;

for (const service of document.querySelectorAll("[data-gate]")) {
  service.addEventListener("click", () => {
    gate.value = service.dataset.gate;
  });
}

function renderPhotos() {
  photoList.replaceChildren();
  photoList.hidden = attachments.length === 0;

  for (const attachment of attachments) {
    const row = document.createElement("li");
    const preview = document.createElement("img");
    preview.src = attachment.url;
    preview.alt = "";
    preview.addEventListener("error", () => preview.remove());

    const name = document.createElement("span");
    name.textContent = attachment.file.name;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "text-button";
    remove.textContent = "Убрать";
    remove.setAttribute("aria-label", "Убрать фото " + attachment.file.name);
    remove.addEventListener("click", () => {
      URL.revokeObjectURL(attachment.url);
      attachments.splice(attachments.indexOf(attachment), 1);
      photoStatus.textContent = "";
      renderPhotos();
      photoInput.focus();
    });

    row.append(preview, name, remove);
    photoList.append(row);
  }
}

photoInput.addEventListener("change", () => {
  const errors = new Set();

  for (const file of photoInput.files) {
    if (attachments.length >= 3) {
      errors.add("Можно прикрепить до трёх фото.");
      break;
    }
    if (!file.type.startsWith("image/") && !/\.(heic|heif|jpe?g|png|webp|gif|avif|bmp)$/i.test(file.name)) {
      errors.add("Выберите файл изображения.");
      continue;
    }
    if (file.size > maxPhotoBytes) {
      errors.add("Размер каждого фото должен быть до 10 МБ.");
      continue;
    }
    if (attachments.some((item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified)) {
      continue;
    }
    attachments.push({ file, url: URL.createObjectURL(file) });
  }

  photoInput.value = "";
  photoStatus.textContent = [...errors].join(" ");
  renderPhotos();
});

function validatePhone() {
  const digits = phone.value.replace(/\D/g, "");
  const valid = /^\+?[\d\s().-]+$/.test(phone.value.trim()) && digits.length >= 10 && digits.length <= 15;
  const message = valid ? "" : "Введите телефон, например +7 900 000-00-00.";
  phone.setCustomValidity(message);
  phone.toggleAttribute("aria-invalid", !valid);
  phoneError.textContent = message;
  return valid;
}

phone.addEventListener("input", () => {
  if (phoneError.textContent) validatePhone();
});
problem.addEventListener("input", () => problem.setCustomValidity(""));

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validatePhone()) {
    phone.reportValidity();
    return;
  }

  const description = problem.value.trim();
  if (!description) {
    problem.setCustomValidity("Опишите, что случилось с воротами.");
    problem.reportValidity();
    return;
  }

  const details = [
    ["Тип ворот", gate.value],
    ["Телефон", phone.value.trim()],
    ["Что случилось", description],
    ["Фото", attachments.map((attachment) => attachment.file.name).join("\n") || "Без фото"],
  ];
  summary.replaceChildren();
  for (const [label, value] of details) {
    const term = document.createElement("dt");
    const definition = document.createElement("dd");
    term.textContent = label;
    definition.textContent = value;
    summary.append(term, definition);
  }
  form.hidden = true;
  result.hidden = false;
  resultTitle.focus();
});

document.querySelector("#edit").addEventListener("click", () => {
  result.hidden = true;
  form.hidden = false;
  gate.focus();
});

document.querySelector("#restart").addEventListener("click", () => {
  form.reset();
  phone.setCustomValidity("");
  phone.removeAttribute("aria-invalid");
  phoneError.textContent = "";
  photoStatus.textContent = "";
  for (const attachment of attachments) URL.revokeObjectURL(attachment.url);
  attachments.length = 0;
  renderPhotos();
  summary.replaceChildren();
  result.hidden = true;
  form.hidden = false;
  gate.focus();
});

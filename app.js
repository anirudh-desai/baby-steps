import {
  getBabyProfile,
  saveBabyProfile,
  getSettings,
  saveSettings,
  getCustomMilestones,
  saveCustomMilestones,
  getReachedMilestones,
  saveReachedMilestones
} from './storage.js';
import milestones from './milestones.js';

const app = document.getElementById('app');
let currentView = 'loading';
let activeModalId = null;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso + 'T00:00:00');
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function clampDate(value) {
  return value ? value.slice(0, 10) : '';
}

function getBabyNameLabels(profile) {
  if (profile.undecidedName || !profile.name) {
    return {
      subject: 'Your baby',
      possessive: "your baby's"
    };
  }

  const possessive = profile.name.endsWith('s')
    ? `${profile.name}'` 
    : `${profile.name}'s`;

  return {
    subject: profile.name,
    possessive
  };
}

function isPrenatalCompleted(milestone, profile) {
  if (!profile.birthDate) {
    return false;
  }

  if (!profile.isExpectedDueDate) {
    return new Date(todayIso()) >= new Date(profile.birthDate + 'T00:00:00');
  }

  const dueDate = new Date(profile.birthDate + 'T00:00:00');
  const weeksUntilDue = 40 - milestone.gestationalWeek;
  const milestoneDate = new Date(dueDate);
  milestoneDate.setDate(milestoneDate.getDate() - weeksUntilDue * 7);

  return new Date(todayIso()) >= milestoneDate;
}

function getAllPostnatalMilestones() {
  const custom = getCustomMilestones();
  return [...milestones.filter((item) => item.type === 'postnatal'), ...custom].sort(
    (a, b) => a.ageLowerDays - b.ageLowerDays || a.ageUpperDays - b.ageUpperDays
  );
}

function getMilestoneById(id) {
  return [...milestones, ...getCustomMilestones()].find((item) => item.id === id) || null;
}

function formatAgeLabel(lower, upper) {
  if (lower === upper) {
    return `Day ${lower}`;
  }

  if (upper <= 30) {
    return `${lower}–${upper} days`;
  }

  const lowerMonths = Math.ceil(lower / 30);
  const upperMonths = Math.ceil(upper / 30);

  if (lower === 0) {
    return `0–${upperMonths} months`;
  }

  return `${lowerMonths}–${upperMonths} months`;
}

function renderView(view) {
  currentView = view;
  if (view === 'onboarding') {
    renderOnboarding();
    return;
  }

  if (view === 'settings') {
    renderSettings();
    return;
  }

  if (view === 'add-custom') {
    renderAddCustom();
    return;
  }

  renderFeed();
}

function renderOnboarding() {
  const profile = getBabyProfile();
  const isDueDate = profile.isExpectedDueDate;
  
  app.innerHTML = `
    <main class="page page-single">
      <section class="card card-panel">
        <div class="section-header">
          <p class="eyebrow">Welcome to Baby Steps</p>
          <h1>Tell us about your baby</h1>
          <p class="lede">We use this profile to personalize milestone labels and prenatal timing.</p>
        </div>

        <form id="onboarding-form" class="form-grid">
          <label class="field">
            <span>Name</span>
            <input name="name" type="text" value="${profile.name || ''}" placeholder="Baby name" ${profile.undecidedName ? 'disabled' : ''} />
          </label>

          <label class="field field-inline">
            <input id="undecidedName" name="undecidedName" type="checkbox" ${profile.undecidedName ? 'checked' : ''} />
            <span>Undecided on a name</span>
          </label>

          <fieldset class="field">
            <legend>Gender</legend>
            <label><input name="gender" type="radio" value="boy" ${profile.gender === 'boy' ? 'checked' : ''} /> Boy</label>
            <label><input name="gender" type="radio" value="girl" ${profile.gender === 'girl' ? 'checked' : ''} /> Girl</label>
            <label><input name="gender" type="radio" value="unknown" ${profile.gender === 'unknown' ? 'checked' : ''} /> Unknown</label>
          </fieldset>

          <label class="field">
            <span>${isDueDate ? 'Expected due date' : 'Birth date'}</span>
            <input name="birthDate" type="date" value="${profile.birthDate || ''}" />
          </label>

          <label class="field field-inline">
            <input id="isExpectedDueDate" name="isExpectedDueDate" type="checkbox" ${profile.isExpectedDueDate ? 'checked' : ''} />
            <span>Baby has not been born yet</span>
          </label>

          <p class="hint">If you're still waiting for baby, use the expected due date. If your baby has arrived, choose the actual birth date.</p>

          <div class="actions">
            <button type="submit" class="button button-primary">Save profile</button>
          </div>
        </form>
      </section>
    </main>
  `;

  const form = document.getElementById('onboarding-form');
  const undecidedCheckbox = document.getElementById('undecidedName');
  const dueDateCheckbox = document.getElementById('isExpectedDueDate');
  const nameInput = form.querySelector('input[name="name"]');
  const birthDateInput = form.querySelector('input[name="birthDate"]');
  const birthDateLabel = birthDateInput.closest('label').querySelector('span');

  undecidedCheckbox.addEventListener('change', () => {
    nameInput.disabled = undecidedCheckbox.checked;
    if (undecidedCheckbox.checked) {
      nameInput.value = '';
    }
  });

  dueDateCheckbox.addEventListener('change', () => {
    birthDateLabel.textContent = dueDateCheckbox.checked ? 'Expected due date' : 'Birth date';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = formData.get('name').trim();
    const undecidedName = formData.get('undecidedName') === 'on';
    const gender = formData.get('gender');
    const birthDate = formData.get('birthDate');
    const isExpectedDueDate = formData.get('isExpectedDueDate') === 'on';

    if (!birthDate) {
      alert('Please enter a date.');
      return;
    }

    if (!undecidedName && !name) {
      alert('Please enter a baby name or mark it as undecided.');
      return;
    }

    saveBabyProfile({
      name: undecidedName ? null : name,
      undecidedName,
      gender,
      birthDate: clampDate(birthDate),
      isExpectedDueDate
    });

    renderView('feed');
  });
}

function renderFeed() {
  const profile = getBabyProfile();
  const settings = getSettings();
  const reached = getReachedMilestones();
  const postnatal = getAllPostnatalMilestones();
  const prenatal = settings.hidePrenatal ? [] : milestones.filter((item) => item.type === 'prenatal');
  const { subject, possessive } = getBabyNameLabels(profile);

  app.innerHTML = `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Milestone tracker</p>
          <h1>${subject} milestones</h1>
          <p class="lede">Track milestones from pre-natal through Year 3.</p>
        </div>
        <div class="toolbar">
          <button class="button button-secondary" data-action="settings">Settings</button>
          <button class="button button-primary" data-action="add-custom">Add milestone</button>
        </div>
      </header>

      ${prenatal.length > 0 ? renderPrenatalSection(prenatal, profile) : ''}

      <section class="section">
        <div class="section-header">
          <h2>Postnatal milestones</h2>
          <p>Mark milestones reached anytime. You can always edit or unmark them later.</p>
        </div>
        <div class="list">
          ${postnatal.map((item) => renderPostnatalCard(item, reached)).join('')}
        </div>
      </section>
    </div>
    <div id="modal-root"></div>
  `;

  app.querySelector('[data-action="settings"]').addEventListener('click', () => renderView('settings'));
  app.querySelector('[data-action="add-custom"]').addEventListener('click', () => renderView('add-custom'));
  app.querySelectorAll('[data-action="reach"]').forEach((button) => {
    button.addEventListener('click', () => {
      const milestoneId = button.dataset.id;
      const milestone = getMilestoneById(milestoneId);
      if (milestone) {
        openReachModal(milestone);
      }
    });
  });
}

function renderPrenatalSection(prenatal, profile) {
  return `
    <section class="section section-prenatal">
      <div class="section-header">
        <h2>Pre-natal milestones</h2>
        <p>These are completed automatically as your due date approaches.</p>
      </div>
      <div class="list">
        ${prenatal
          .sort((a, b) => a.gestationalWeek - b.gestationalWeek)
          .map((item) => {
            const completed = isPrenatalCompleted(item, profile);
            return `
              <article class="card card-prenatal ${completed ? 'complete' : ''}">
                <div class="meta">
                  <span>Week ${item.gestationalWeek}</span>
                  <span class="status ${completed ? 'status-complete' : 'status-pending'}">${completed ? 'Completed' : 'Upcoming'}</span>
                </div>
                <h3>${item.title}</h3>
                <p class="weekly-fact">${item.weeklyFact}</p>
                <p>${item.description}</p>
              </article>
            `;
          })
          .join('')}
      </div>
    </section>
  `;
}

function renderPostnatalCard(item, reached) {
  const milestoneReached = reached && reached[item.id];
  const reachedLabel = milestoneReached ? formatDate(milestoneReached.date) : '';

  return `
    <article class="card milestone-card">
      <div class="meta">
        <span class="age-label">${item.ageLabel}</span>
        ${item.critical ? '<span class="star">★</span>' : ''}
      </div>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <div class="card-footer">
        ${milestoneReached ? `<span class="status status-complete">✓ ${reachedLabel || 'Reached'}</span>` : `<button class="button button-primary" data-action="reach" data-id="${item.id}">Reached</button>`}
      </div>
    </article>
  `;
}

function openReachModal(milestone) {
  activeModalId = milestone.id;
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="close-modal"></div>
    <div class="modal-card">
      <h2>Mark reached</h2>
      <p class="hint">Add the date the milestone was reached, or leave it blank to save without a date.</p>
      <form id="reach-form">
        <label class="field">
          <span>Date reached</span>
          <input name="date" type="date" max="${todayIso()}" value="${todayIso()}" />
        </label>
        <div class="modal-actions">
          <button type="button" class="button button-secondary" data-action="cancel-modal">Cancel</button>
          <button type="submit" class="button button-primary">Save</button>
        </div>
      </form>
    </div>
  `;

  modalRoot.querySelector('[data-action="close-modal"]').addEventListener('click', closeModal);
  modalRoot.querySelector('[data-action="cancel-modal"]').addEventListener('click', closeModal);
  modalRoot.querySelector('#reach-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const dateValue = formData.get('date');
    const reached = getReachedMilestones();
    reached[activeModalId] = {
      date: dateValue ? clampDate(dateValue) : null
    };
    saveReachedMilestones(reached);
    closeModal();
    renderView('feed');
  });
}

function closeModal() {
  activeModalId = null;
  const modalRoot = document.getElementById('modal-root');
  if (modalRoot) {
    modalRoot.innerHTML = '';
  }
}

function renderSettings() {
  const profile = getBabyProfile();
  const settings = getSettings();
  const reached = getReachedMilestones();
  const completedIds = Object.keys(reached);

  app.innerHTML = `
    <main class="page page-single">
      <section class="card card-panel">
        <div class="section-header">
          <p class="eyebrow">Settings</p>
          <h1>Edit profile and preferences</h1>
          <p class="lede">Update baby details or manage completed milestones at any time.</p>
        </div>

        <form id="settings-form" class="form-grid">
          <label class="field">
            <span>Name</span>
            <input name="name" type="text" value="${profile.name || ''}" placeholder="Baby name" ${profile.undecidedName ? 'disabled' : ''} />
          </label>

          <label class="field field-inline">
            <input id="undecidedName" name="undecidedName" type="checkbox" ${profile.undecidedName ? 'checked' : ''} />
            <span>Undecided on a name</span>
          </label>

          <fieldset class="field">
            <legend>Gender</legend>
            <label><input name="gender" type="radio" value="boy" ${profile.gender === 'boy' ? 'checked' : ''} /> Boy</label>
            <label><input name="gender" type="radio" value="girl" ${profile.gender === 'girl' ? 'checked' : ''} /> Girl</label>
            <label><input name="gender" type="radio" value="unknown" ${profile.gender === 'unknown' ? 'checked' : ''} /> Unknown</label>
          </fieldset>

          <label class="field">
            <span>${profile.isExpectedDueDate ? 'Expected due date' : 'Birth date'}</span>
            <input name="birthDate" type="date" value="${profile.birthDate || ''}" />
          </label>

          <label class="field field-inline">
            <input id="isExpectedDueDate" name="isExpectedDueDate" type="checkbox" ${profile.isExpectedDueDate ? 'checked' : ''} />
            <span>Baby has not been born yet</span>
          </label>

          <label class="field field-inline">
            <input id="hidePrenatal" name="hidePrenatal" type="checkbox" ${settings.hidePrenatal ? 'checked' : ''} />
            <span>Hide prenatal milestones</span>
          </label>

          <div class="actions">
            <button type="button" class="button button-secondary" data-action="back">Back</button>
            <button type="submit" class="button button-primary">Save changes</button>
          </div>
        </form>
      </section>

      <section class="card card-panel">
        <div class="section-header">
          <h2>Completed milestones</h2>
          <p>Unmark any milestone if you want to reset it.</p>
        </div>
        <div class="list list-tight">
          ${completedIds.length > 0 ? completedIds.map((id) => {
            const milestone = getMilestoneById(id);
            const reachedItem = reached[id];
            return `
              <article class="list-item">
                <div>
                  <strong>${milestone ? milestone.title : id}</strong>
                  <div class="muted">${reachedItem.date ? formatDate(reachedItem.date) : 'Reached'}</div>
                </div>
                <button class="button button-tertiary" data-action="unmark" data-id="${id}">Unmark</button>
              </article>
            `;
          }).join('') : '<p class="hint">No milestones have been marked complete yet.</p>'}
        </div>
      </section>
    </main>
  `;

  app.querySelector('#undecidedName').addEventListener('change', (event) => {
    const nameInput = app.querySelector('input[name="name"]');
    nameInput.disabled = event.target.checked;
    if (event.target.checked) {
      nameInput.value = '';
    }
  });

  app.querySelector('#isExpectedDueDate').addEventListener('change', (event) => {
    const birthDateInput = app.querySelector('input[name="birthDate"]');
    const birthDateLabel = birthDateInput.closest('label').querySelector('span');
    if (birthDateLabel) {
      birthDateLabel.textContent = event.target.checked ? 'Expected due date' : 'Birth date';
    }
  });

  app.querySelector('[data-action="back"]').addEventListener('click', () => renderView('feed'));
  app.querySelector('#settings-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('name').trim();
    const undecidedName = formData.get('undecidedName') === 'on';
    const gender = formData.get('gender');
    const birthDate = formData.get('birthDate');
    const isExpectedDueDate = formData.get('isExpectedDueDate') === 'on';
    const hidePrenatal = formData.get('hidePrenatal') === 'on';

    if (!birthDate) {
      alert('Please enter a date.');
      return;
    }

    if (!undecidedName && !name) {
      alert('Please enter a baby name or mark it as undecided.');
      return;
    }

    saveBabyProfile({
      name: undecidedName ? null : name,
      undecidedName,
      gender,
      birthDate: clampDate(birthDate),
      isExpectedDueDate
    });
    saveSettings({ hidePrenatal });
    renderView('feed');
  });

  app.querySelectorAll('[data-action="unmark"]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const reachedItems = getReachedMilestones();
      delete reachedItems[id];
      saveReachedMilestones(reachedItems);
      renderView('settings');
    });
  });
}

function renderAddCustom() {
  const profile = getBabyProfile();
  const { subject } = getBabyNameLabels(profile);

  app.innerHTML = `
    <main class="page page-single">
      <section class="card card-panel">
        <div class="section-header">
          <p class="eyebrow">Add custom milestone</p>
          <h1>Cherish a personal milestone</h1>
          <p class="lede">Add a special moment to ${subject}'s milestone timeline.</p>
        </div>

        <form id="custom-form" class="form-grid">
          <label class="field">
            <span>Milestone title</span>
            <input name="title" type="text" placeholder="e.g. First family outing" required />
          </label>

          <label class="field">
            <span>Description</span>
            <textarea name="description" rows="3" placeholder="Optional details"></textarea>
          </label>

          <label class="field">
            <span>Age lower bound (days)</span>
            <input name="ageLowerDays" type="number" min="0" value="0" required />
          </label>

          <label class="field">
            <span>Age upper bound (days)</span>
            <input name="ageUpperDays" type="number" min="0" value="30" required />
          </label>

          <div class="actions">
            <button type="button" class="button button-secondary" data-action="back">Back</button>
            <button type="submit" class="button button-primary">Save milestone</button>
          </div>
        </form>
      </section>
    </main>
  `;

  app.querySelector('[data-action="back"]').addEventListener('click', () => renderView('feed'));
  app.querySelector('#custom-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const title = formData.get('title').trim();
    const description = formData.get('description').trim();
    const lower = Number(formData.get('ageLowerDays'));
    const upper = Number(formData.get('ageUpperDays'));

    if (!title) {
      alert('Please enter a title for the custom milestone.');
      return;
    }

    if (Number.isNaN(lower) || Number.isNaN(upper) || lower < 0 || upper < lower) {
      alert('Please enter a valid age range.');
      return;
    }

    const customMilestones = getCustomMilestones();
    customMilestones.push({
      id: `custom_${Date.now()}`,
      type: 'postnatal',
      ageLowerDays: lower,
      ageUpperDays: upper,
      ageLabel: formatAgeLabel(lower, upper),
      title,
      description,
      critical: false,
      custom: true
    });

    saveCustomMilestones(customMilestones);
    renderView('feed');
  });
}

function init() {
  if (!getBabyProfile().birthDate) {
    renderView('onboarding');
  } else {
    renderView('feed');
  }

  if (
    'serviceWorker' in navigator &&
    location.hostname !== 'localhost' &&
    location.hostname !== '127.0.0.1'
  ) {
    navigator.serviceWorker
      .register('./sw.js')
      .then(() => console.log('Service worker registered.'))
      .catch((error) => console.warn('Service worker registration failed:', error));
  }
}

init();

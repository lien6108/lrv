const STORAGE_KEY = "focus-flow-state";
const TIMER_SECONDS = 25 * 60;

const els = {
  todayCount: document.getElementById("today-count"),
  pendingCount: document.getElementById("pending-count"),
  streakCount: document.getElementById("streak-count"),
  tabButtons: Array.from(document.querySelectorAll("[data-view]")),
  viewPanels: Array.from(document.querySelectorAll("[data-view-panel]")),
  timerStatus: document.getElementById("timer-status"),
  timerDisplay: document.getElementById("timer-display"),
  currentTaskName: document.getElementById("current-task-name"),
  currentProjectName: document.getElementById("current-project-name"),
  taskForm: document.getElementById("task-form"),
  taskInput: document.getElementById("task-input"),
  taskProjectSelect: document.getElementById("task-project-select"),
  taskList: document.getElementById("task-list"),
  taskEmptyState: document.getElementById("task-empty-state"),
  projectForm: document.getElementById("project-form"),
  projectInput: document.getElementById("project-input"),
  projectParentSelect: document.getElementById("project-parent-select"),
  projectEmptyState: document.getElementById("project-empty-state"),
  projectRootList: document.getElementById("project-root-list"),
  rootProjectCount: document.getElementById("root-project-count"),
  projectDetailTitle: document.getElementById("project-detail-title"),
  projectDetailDescription: document.getElementById("project-detail-description"),
  projectDetailStatus: document.getElementById("project-detail-status"),
  detailChildCount: document.getElementById("detail-child-count"),
  detailOpenTaskCount: document.getElementById("detail-open-task-count"),
  detailTotalTaskCount: document.getElementById("detail-total-task-count"),
  childProjectList: document.getElementById("child-project-list"),
  childProjectEmpty: document.getElementById("child-project-empty"),
  relatedTaskList: document.getElementById("related-task-list"),
  relatedTaskEmpty: document.getElementById("related-task-empty"),
  heatmapGrid: document.getElementById("heatmap-grid"),
  startButton: document.getElementById("start-button"),
  pauseButton: document.getElementById("pause-button"),
  resetButton: document.getElementById("reset-button"),
  completeButton: document.getElementById("complete-button"),
  projectRootItemTemplate: document.getElementById("project-root-item-template"),
  detailItemTemplate: document.getElementById("detail-item-template"),
  taskItemTemplate: document.getElementById("task-item-template"),
  meetingForm: document.getElementById("meeting-form"),
  meetingInput: document.getElementById("meeting-input"),
  meetingTimeInput: document.getElementById("meeting-time-input"),
  meetingDurationInput: document.getElementById("meeting-duration-input"),
  meetingProjectSelect: document.getElementById("meeting-project-select"),
  meetingList: document.getElementById("meeting-list"),
  meetingEmptyState: document.getElementById("meeting-empty-state"),
  meetingItemTemplate: document.getElementById("meeting-item-template"),
  meetingImportToggle: document.getElementById("meeting-import-toggle"),
  meetingImportPanel: document.getElementById("meeting-import-panel"),
  meetingImportTextarea: document.getElementById("meeting-import-textarea"),
  meetingImportParse: document.getElementById("meeting-import-parse"),
  meetingImportPreview: document.getElementById("meeting-import-preview"),
  meetingImportSummary: document.getElementById("meeting-import-summary"),
  meetingImportPreviewMeetings: document.getElementById("meeting-import-preview-meetings"),
  meetingImportPreviewTasks: document.getElementById("meeting-import-preview-tasks"),
  meetingImportPreviewUnparsedGroup: document.getElementById("meeting-import-preview-unparsed-group"),
  meetingImportPreviewUnparsed: document.getElementById("meeting-import-preview-unparsed"),
  meetingImportConfirm: document.getElementById("meeting-import-confirm"),
  meetingImportCancel: document.getElementById("meeting-import-cancel"),
  reviewOpenButton: document.getElementById("review-open-button"),
  reviewCloseButton: document.getElementById("review-close-button"),
  reviewDateInput: document.getElementById("review-date-input"),
  reviewContent: document.getElementById("review-content"),
  reviewCompletedList: document.getElementById("review-completed-list"),
  reviewCompletedEmpty: document.getElementById("review-completed-empty"),
  reviewInprogressList: document.getElementById("review-inprogress-list"),
  reviewInprogressEmpty: document.getElementById("review-inprogress-empty"),
  reviewMeetingsList: document.getElementById("review-meetings-list"),
  reviewMeetingsEmpty: document.getElementById("review-meetings-empty"),
  reviewAnswer0: document.getElementById("review-answer-0"),
  reviewAnswer1: document.getElementById("review-answer-1"),
  reviewAnswer2: document.getElementById("review-answer-2"),
  reviewTodoList: document.getElementById("review-todo-list"),
  reviewTodoAddForm: document.getElementById("review-todo-add-form"),
  reviewTodoAddInput: document.getElementById("review-todo-add-input"),
  reviewTodoItemTemplate: document.getElementById("review-todo-item-template"),
  reviewGenerateButton: document.getElementById("review-generate-button"),
  reviewOutput: document.getElementById("review-output"),
  reviewOutputTextarea: document.getElementById("review-output-textarea"),
  reviewCopyButton: document.getElementById("review-copy-button"),
  reviewDownloadButton: document.getElementById("review-download-button"),
};

const initialProjects = buildInitialProjects();
const initialState = {
  activeView: "workspace",
  projects: initialProjects,
  tasks: buildInitialTasks(initialProjects),
  meetings: [],
  pomodoroSessions: [],
  stats: seedStats(),
  currentTaskId: null,
  activeProjectId: initialProjects[0].id,
  timer: {
    status: "idle",
    remainingSeconds: TIMER_SECONDS,
    startedAt: null,
  },
};

initialState.currentTaskId = initialState.tasks.find((task) => !task.completed)?.id || null;

let state = loadState();
let timerInterval = null;
let editingMeetingId = null;
let pendingImport = null;
let isReviewOpen = false;

normalizeState();
render();
bindEvents();

function bindEvents() {
  els.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeView = button.dataset.view;
      persistAndRender();
    });
  });

  els.taskForm.addEventListener("submit", handleTaskCreate);
  els.projectForm.addEventListener("submit", handleProjectCreate);
  els.startButton.addEventListener("click", startTimer);
  els.pauseButton.addEventListener("click", pauseTimer);
  els.resetButton.addEventListener("click", resetTimer);
  els.completeButton.addEventListener("click", completePomodoro);

  els.meetingForm.addEventListener("submit", handleMeetingCreate);
  els.meetingImportToggle.addEventListener("click", toggleMeetingImportPanel);
  els.meetingImportParse.addEventListener("click", handleMeetingImportParse);
  els.meetingImportConfirm.addEventListener("click", handleMeetingImportConfirm);
  els.meetingImportCancel.addEventListener("click", handleMeetingImportCancel);

  els.reviewOpenButton.addEventListener("click", openReviewView);
  els.reviewCloseButton.addEventListener("click", closeReviewView);
  els.reviewDateInput.addEventListener("change", handleReviewDateChange);
  els.reviewTodoAddForm.addEventListener("submit", handleReviewTodoAdd);
  els.reviewGenerateButton.addEventListener("click", handleReviewGenerate);
  els.reviewCopyButton.addEventListener("click", handleReviewCopy);
  els.reviewDownloadButton.addEventListener("click", handleReviewDownload);
}

function handleProjectCreate(event) {
  event.preventDefault();

  const name = els.projectInput.value.trim();
  const parentId = els.projectParentSelect.value || null;
  if (!name) {
    els.projectInput.focus();
    return;
  }

  const project = createProject(name, parentId);
  state.projects.unshift(project);
  state.activeProjectId = parentId ? getRootProjectId(parentId) : project.id;
  els.projectInput.value = "";
  els.projectParentSelect.value = "";
  persistAndRender();
}

function handleTaskCreate(event) {
  event.preventDefault();

  const title = els.taskInput.value.trim();
  if (!title) {
    els.taskInput.focus();
    return;
  }

  const projectId = els.taskProjectSelect.value || null;
  state.tasks.unshift(createTask(title, projectId));

  if (!state.currentTaskId) {
    state.currentTaskId = state.tasks[0].id;
  }

  els.taskInput.value = "";
  persistAndRender();
}

function handleMeetingCreate(event) {
  event.preventDefault();

  const title = els.meetingInput.value.trim();
  const startTime = els.meetingTimeInput.value;
  const durationMinutes = Number(els.meetingDurationInput.value);

  if (!title || !startTime || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    els.meetingInput.focus();
    return;
  }

  const projectId = els.meetingProjectSelect.value || null;
  state.meetings.unshift(createMeeting(title, startTime, durationMinutes, projectId));

  els.meetingInput.value = "";
  els.meetingTimeInput.value = "";
  els.meetingDurationInput.value = "";
  persistAndRender();
}

function handleMeetingEdit(meetingId) {
  editingMeetingId = meetingId;
  renderMeetings();
}

function handleMeetingCancelEdit() {
  editingMeetingId = null;
  renderMeetings();
}

function handleMeetingSave(meetingId, titleInput, timeInput, durationInput, projectSelect) {
  const meeting = state.meetings.find((item) => item.id === meetingId);
  if (!meeting) {
    return;
  }

  const title = titleInput.value.trim();
  const startTime = timeInput.value;
  const durationMinutes = Number(durationInput.value);

  if (!title || !startTime || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return;
  }

  meeting.title = title;
  meeting.startTime = startTime;
  meeting.durationMinutes = durationMinutes;
  meeting.projectId = projectSelect.value || null;

  editingMeetingId = null;
  persistAndRender();
}

function handleMeetingDelete(meetingId) {
  state.meetings = state.meetings.filter((meeting) => meeting.id !== meetingId);
  if (editingMeetingId === meetingId) {
    editingMeetingId = null;
  }
  persistAndRender();
}

function toggleMeetingImportPanel() {
  const isHidden = els.meetingImportPanel.classList.toggle("hidden");
  if (isHidden) {
    pendingImport = null;
    els.meetingImportPreview.classList.add("hidden");
  }
}

function handleMeetingImportParse() {
  pendingImport = parseDigestText(els.meetingImportTextarea.value);
  renderImportPreview();
}

function handleMeetingImportConfirm() {
  if (!pendingImport) {
    return;
  }

  const today = formatDateKey(new Date());

  pendingImport.meetings.forEach((parsedMeeting) => {
    state.meetings.unshift(createMeeting(parsedMeeting.title, parsedMeeting.startTime, parsedMeeting.durationMinutes, null, today));
  });

  pendingImport.tasks.forEach((parsedTask) => {
    state.tasks.unshift(createTask(parsedTask.title, null, 0, false, parsedTask.priority, parsedTask.status));
  });

  pendingImport = null;
  els.meetingImportTextarea.value = "";
  els.meetingImportPreview.classList.add("hidden");
  persistAndRender();
}

function handleMeetingImportCancel() {
  pendingImport = null;
  els.meetingImportPreview.classList.add("hidden");
}

function openReviewView() {
  if (isReviewOpen) {
    return;
  }
  isReviewOpen = true;

  els.reviewDateInput.value = "";
  els.reviewContent.classList.add("hidden");
  els.reviewOutput.classList.add("hidden");

  els.viewPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.viewPanel === "review");
  });
}

function closeReviewView() {
  isReviewOpen = false;
  renderTabs();
}

function handleReviewDateChange() {
  els.reviewOutput.classList.add("hidden");

  const date = els.reviewDateInput.value;
  if (!date) {
    els.reviewContent.classList.add("hidden");
    return;
  }

  els.reviewContent.classList.remove("hidden");
  els.reviewAnswer0.value = "";
  els.reviewAnswer1.value = "";
  els.reviewAnswer2.value = "";
  renderReviewSummary(date);
  renderReviewTodos();
}

function renderReviewSummary(date) {
  const completedTasks = getCompletedTasksForDate(date);
  renderReviewListItems(
    els.reviewCompletedList,
    completedTasks.map((task) => `${task.title}。投入 ${getPomodoroHoursForTask(task.id, date).toFixed(1)} 小時。`)
  );
  els.reviewCompletedEmpty.classList.toggle("hidden", completedTasks.length > 0);

  const inProgressTasks = getInProgressTasks();
  renderReviewListItems(
    els.reviewInprogressList,
    inProgressTasks.map((task) => `${task.title}。狀態：${task.status || "未標示"}。Priority：${task.priority || "未標示"}。`)
  );
  els.reviewInprogressEmpty.classList.toggle("hidden", inProgressTasks.length > 0);

  const meetings = getMeetingsForDate(date);
  renderReviewListItems(
    els.reviewMeetingsList,
    meetings.map((meeting) => `${meeting.startTime}-${addMinutesToTime(meeting.startTime, meeting.durationMinutes)} ${meeting.title}。`)
  );
  els.reviewMeetingsEmpty.classList.toggle("hidden", meetings.length > 0);
}

function renderReviewListItems(listElement, lines) {
  listElement.innerHTML = "";
  lines.forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    listElement.appendChild(item);
  });
}

function renderReviewTodos() {
  els.reviewTodoList.innerHTML = "";
  getInProgressTasks().forEach((task) => appendReviewTodoItem(task.title));
}

function appendReviewTodoItem(value) {
  const fragment = els.reviewTodoItemTemplate.content.cloneNode(true);
  const item = fragment.querySelector(".review-todo-item");
  const input = fragment.querySelector(".review-todo-input");
  const deleteButton = fragment.querySelector(".review-todo-delete");

  input.value = value;
  deleteButton.addEventListener("click", () => item.remove());

  els.reviewTodoList.appendChild(fragment);
}

function handleReviewTodoAdd(event) {
  event.preventDefault();

  const value = els.reviewTodoAddInput.value.trim();
  if (!value) {
    els.reviewTodoAddInput.focus();
    return;
  }

  appendReviewTodoItem(value);
  els.reviewTodoAddInput.value = "";
}

function handleReviewGenerate() {
  const date = els.reviewDateInput.value;
  if (!date) {
    return;
  }

  els.reviewOutputTextarea.value = buildReviewMarkdown(date);
  els.reviewOutput.classList.remove("hidden");
}

function buildReviewMarkdown(date) {
  const completedTasks = getCompletedTasksForDate(date);
  const inProgressTasks = getInProgressTasks();
  const meetings = getMeetingsForDate(date);
  const todos = Array.from(els.reviewTodoList.querySelectorAll(".review-todo-input"))
    .map((input) => input.value.trim())
    .filter(Boolean);

  const completedSection = completedTasks.length
    ? completedTasks
        .map((task) => `- ${task.title}。投入 ${getPomodoroHoursForTask(task.id, date).toFixed(1)} 小時。`)
        .join("\n")
    : "這天沒有完成的任務。";

  const inProgressSection = inProgressTasks.length
    ? inProgressTasks
        .map((task) => `- ${task.title}。狀態：${task.status || "未標示"}。Priority：${task.priority || "未標示"}。`)
        .join("\n")
    : "目前沒有進行中的任務。";

  const meetingsSection = meetings.length
    ? meetings
        .map((meeting) => `- ${meeting.startTime}-${addMinutesToTime(meeting.startTime, meeting.durationMinutes)} ${meeting.title}。`)
        .join("\n")
    : "這天沒有會議紀錄。";

  const wellDone = els.reviewAnswer0.value.trim() || "今日無資料。";
  const stuck = els.reviewAnswer1.value.trim() || "今日無資料。";
  const improvement = els.reviewAnswer2.value.trim() || "今日無資料。";
  const todosSection = todos.map((todo) => `- [ ] ${todo}。`).join("\n");

  return `# ${date} 工作回顧

## 今天完成的事
${completedSection}

## 今天推進中的事
${inProgressSection}

## 今天的會議
${meetingsSection}

## 復盤筆記
### 做得好的地方
${wellDone}

### 卡住或需要調整的地方
${stuck}

### 明天的一個小改進
${improvement}

## 明天要做的事
${todosSection}
`;
}

function handleReviewCopy() {
  if (!navigator.clipboard) {
    els.reviewOutputTextarea.select();
    return;
  }

  navigator.clipboard.writeText(els.reviewOutputTextarea.value).catch(() => {
    els.reviewOutputTextarea.select();
  });
}

function handleReviewDownload() {
  const date = els.reviewDateInput.value;
  const blob = new Blob([els.reviewOutputTextarea.value], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${date}-工作回顧.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getCompletedTasksForDate(date) {
  return state.tasks.filter(
    (task) => task.completed && task.completedAt && formatDateKey(new Date(task.completedAt)) === date
  );
}

function getInProgressTasks() {
  return state.tasks.filter((task) => !task.completed);
}

function getMeetingsForDate(date) {
  return state.meetings
    .filter((meeting) => meeting.date === date)
    .slice()
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

function getPomodoroHoursForTask(taskId, date) {
  const count = state.pomodoroSessions.filter((session) => session.taskId === taskId && session.date === date).length;
  return Math.round(count * (TIMER_SECONDS / 3600) * 10) / 10;
}

function startTimer() {
  if (state.timer.status === "running") {
    return;
  }

  state.timer.status = "running";
  state.timer.startedAt = Date.now();
  clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 1000);
  persistAndRender();
}

function pauseTimer() {
  if (state.timer.status !== "running") {
    return;
  }

  state.timer.status = "paused";
  clearInterval(timerInterval);
  persistAndRender();
}

function resetTimer() {
  clearInterval(timerInterval);
  state.timer.status = "idle";
  state.timer.remainingSeconds = TIMER_SECONDS;
  state.timer.startedAt = null;
  persistAndRender();
}

function tickTimer() {
  if (state.timer.remainingSeconds <= 1) {
    completePomodoro();
    return;
  }

  state.timer.remainingSeconds -= 1;
  renderTimer();
}

function completePomodoro() {
  clearInterval(timerInterval);
  incrementTodayStat();

  if (state.currentTaskId) {
    const currentTask = state.tasks.find((task) => task.id === state.currentTaskId);
    if (currentTask) {
      currentTask.pomodoros += 1;
    }
  }

  state.pomodoroSessions.push(createPomodoroSession(state.currentTaskId));

  state.timer.status = "completed";
  state.timer.remainingSeconds = TIMER_SECONDS;
  state.timer.startedAt = null;
  persistAndRender();
}

function incrementTodayStat() {
  const today = formatDateKey(new Date());
  const todayStat = state.stats.find((entry) => entry.date === today);

  if (todayStat) {
    todayStat.completedCount += 1;
  } else {
    state.stats.push({ date: today, completedCount: 1 });
  }
}

function render() {
  renderTabs();
  renderSummary();
  renderTimer();
  renderProjects();
  renderTasks();
  renderMeetings();
  renderHeatmap();
  renderTaskProjectOptions();
  renderProjectParentOptions();
  renderMeetingProjectOptions();
}

function renderTabs() {
  els.tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.activeView);
  });

  els.viewPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.viewPanel === state.activeView);
  });
}

function renderSummary() {
  const today = formatDateKey(new Date());
  const todayStat = state.stats.find((entry) => entry.date === today);

  els.todayCount.textContent = String(todayStat ? todayStat.completedCount : 0);
  els.pendingCount.textContent = String(state.tasks.filter((task) => !task.completed).length);
  els.streakCount.textContent = String(calculateStreak());
}

function renderTimer() {
  els.timerDisplay.textContent = formatDuration(state.timer.remainingSeconds);
  els.timerStatus.textContent = timerStatusText(state.timer.status);

  const currentTask = state.tasks.find((task) => task.id === state.currentTaskId);
  els.currentTaskName.textContent = currentTask ? currentTask.title : "尚未選擇任務";
  els.currentProjectName.textContent = currentTask?.projectId ? getProjectPathLabel(currentTask.projectId) : "尚未指定專案";
}

function renderProjects() {
  const rootProjects = getRootProjects();
  const activeProject = getActiveRootProject();

  els.projectRootList.innerHTML = "";
  els.rootProjectCount.textContent = `${rootProjects.length} 個主專案`;
  els.projectEmptyState.classList.toggle("hidden", rootProjects.length > 0);

  rootProjects.forEach((project) => {
    const fragment = els.projectRootItemTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".project-root-item");
    const button = fragment.querySelector(".project-root-button");
    const title = fragment.querySelector(".project-root-title");
    const meta = fragment.querySelector(".project-root-meta");
    const stateTag = fragment.querySelector(".project-root-state");
    const descendants = [project.id, ...getDescendantProjectIds(project.id)];
    const tasks = state.tasks.filter((task) => descendants.includes(task.projectId));
    const openTasks = tasks.filter((task) => !task.completed).length;
    const childCount = getChildProjects(project.id).length;

    title.textContent = project.name;
    meta.textContent = `${childCount} 個子專案 · ${openTasks} 項未完成 · ${tasks.length} 項任務`;
    stateTag.textContent = projectStatusText(openTasks, childCount);
    item.classList.toggle("is-active", activeProject?.id === project.id);

    button.addEventListener("click", () => {
      state.activeProjectId = project.id;
      persistAndRender();
    });

    els.projectRootList.appendChild(fragment);
  });

  renderProjectDetail(activeProject);
}

function renderProjectDetail(project) {
  if (!project) {
    els.projectDetailTitle.textContent = "尚未選擇專案";
    els.projectDetailDescription.textContent = "從左側選擇一個主專案後，這裡會展開該專案的摘要、子專案與關聯任務。";
    els.projectDetailStatus.textContent = "尚未選擇";
    els.detailChildCount.textContent = "0";
    els.detailOpenTaskCount.textContent = "0";
    els.detailTotalTaskCount.textContent = "0";
    els.childProjectList.innerHTML = "";
    els.relatedTaskList.innerHTML = "";
    els.childProjectEmpty.hidden = false;
    els.relatedTaskEmpty.hidden = false;
    return;
  }

  const childProjects = getChildProjects(project.id);
  const relatedProjectIds = [project.id, ...getDescendantProjectIds(project.id)];
  const relatedTasks = state.tasks.filter((task) => relatedProjectIds.includes(task.projectId));
  const openTaskCount = relatedTasks.filter((task) => !task.completed).length;

  els.projectDetailTitle.textContent = getProjectPathLabel(project.id);
  els.projectDetailDescription.textContent = buildProjectDescription(project, childProjects.length, relatedTasks.length);
  els.projectDetailStatus.textContent = projectStatusText(openTaskCount, childProjects.length);
  els.detailChildCount.textContent = String(childProjects.length);
  els.detailOpenTaskCount.textContent = String(openTaskCount);
  els.detailTotalTaskCount.textContent = String(relatedTasks.length);

  renderChildProjects(childProjects);
  renderRelatedTasks(relatedTasks);
}

function renderChildProjects(childProjects) {
  els.childProjectList.innerHTML = "";
  els.childProjectEmpty.hidden = childProjects.length > 0;

  childProjects.forEach((project) => {
    const fragment = els.detailItemTemplate.content.cloneNode(true);
    const title = fragment.querySelector(".detail-item-title");
    const meta = fragment.querySelector(".detail-item-meta");
    const stateTag = fragment.querySelector(".detail-item-state");
    const descendants = [project.id, ...getDescendantProjectIds(project.id)];
    const tasks = state.tasks.filter((task) => descendants.includes(task.projectId));
    const openTasks = tasks.filter((task) => !task.completed).length;

    title.textContent = project.name;
    meta.textContent = `${tasks.length} 項任務 · ${openTasks} 項未完成`;
    stateTag.textContent = projectStatusText(openTasks, getChildProjects(project.id).length);

    els.childProjectList.appendChild(fragment);
  });
}

function renderRelatedTasks(tasks) {
  els.relatedTaskList.innerHTML = "";
  els.relatedTaskEmpty.hidden = tasks.length > 0;

  tasks
    .slice()
    .sort((left, right) => Number(left.completed) - Number(right.completed))
    .forEach((task) => {
      const fragment = els.detailItemTemplate.content.cloneNode(true);
      const item = fragment.querySelector(".detail-item");
      const title = fragment.querySelector(".detail-item-title");
      const meta = fragment.querySelector(".detail-item-meta");
      const stateTag = fragment.querySelector(".detail-item-state");

      title.textContent = task.title;
      meta.textContent = `${task.projectId ? getProjectPathLabel(task.projectId) : "未指派專案"} · ${task.pomodoros} 顆番茄`;
      stateTag.textContent = task.completed ? "已完成" : "進行中";
      item.classList.toggle("is-completed", task.completed);

      els.relatedTaskList.appendChild(fragment);
    });
}

function renderTasks() {
  els.taskList.innerHTML = "";
  els.taskEmptyState.classList.toggle("hidden", state.tasks.length > 0);

  state.tasks.forEach((task) => {
    const fragment = els.taskItemTemplate.content.cloneNode(true);
    const taskItem = fragment.querySelector(".task-item");
    const taskMain = fragment.querySelector(".task-main");
    const taskTitle = fragment.querySelector(".task-title");
    const taskMeta = fragment.querySelector(".task-meta");
    const taskSelectButton = fragment.querySelector(".task-select");
    const taskToggleButton = fragment.querySelector(".task-toggle");
    const taskProjectSelect = fragment.querySelector(".task-project-select");

    taskTitle.textContent = task.title;
    taskMeta.innerHTML = `
      <span class="project-badge">${task.projectId ? getProjectPathLabel(task.projectId) : "未指派專案"}</span>
      <span>${task.pomodoros} 顆番茄${task.completed ? " · 已完成" : ""}</span>
    `;

    taskItem.classList.toggle("is-current", task.id === state.currentTaskId);
    taskItem.classList.toggle("is-completed", task.completed);

    buildProjectSelect(taskProjectSelect, task.projectId);

    taskMain.addEventListener("click", () => {
      state.currentTaskId = task.id;
      persistAndRender();
    });

    taskSelectButton.addEventListener("click", () => {
      state.currentTaskId = task.id;
      persistAndRender();
    });

    taskProjectSelect.addEventListener("change", () => {
      task.projectId = taskProjectSelect.value || null;
      persistAndRender();
    });

    taskToggleButton.textContent = task.completed ? "取消完成" : "完成";
    taskToggleButton.addEventListener("click", () => {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;

      if (task.completed && state.currentTaskId === task.id) {
        const nextTask = state.tasks.find((item) => !item.completed && item.id !== task.id);
        state.currentTaskId = nextTask ? nextTask.id : null;
      }

      persistAndRender();
    });

    els.taskList.appendChild(fragment);
  });
}

function renderTaskProjectOptions() {
  buildProjectSelect(els.taskProjectSelect, state.activeProjectId);
}

function renderMeetingProjectOptions() {
  buildProjectSelect(els.meetingProjectSelect, null);
}

function renderMeetings() {
  const todaysMeetings = getMeetingsForDate(formatDateKey(new Date()));

  els.meetingList.innerHTML = "";
  els.meetingEmptyState.classList.toggle("hidden", todaysMeetings.length > 0);

  todaysMeetings.forEach((meeting) => {
    const fragment = els.meetingItemTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".meeting-item");
    const title = fragment.querySelector(".meeting-title");
    const meta = fragment.querySelector(".meeting-meta");
    const editButton = fragment.querySelector(".meeting-edit");
    const deleteButton = fragment.querySelector(".meeting-delete");
    const editTitleInput = fragment.querySelector(".meeting-edit-title");
    const editTimeInput = fragment.querySelector(".meeting-edit-time");
    const editDurationInput = fragment.querySelector(".meeting-edit-duration");
    const editProjectSelect = fragment.querySelector(".meeting-edit-project");
    const saveButton = fragment.querySelector(".meeting-save");
    const cancelButton = fragment.querySelector(".meeting-cancel-edit");

    const endTime = addMinutesToTime(meeting.startTime, meeting.durationMinutes);
    title.textContent = meeting.title;
    meta.innerHTML = `
      <span>${meeting.startTime} - ${endTime}</span>
      <span>${meeting.durationMinutes} 分鐘</span>
      <span class="project-badge">${meeting.projectId ? getProjectPathLabel(meeting.projectId) : "未指派專案"}</span>
    `;

    item.classList.toggle("is-editing", editingMeetingId === meeting.id);

    editTitleInput.value = meeting.title;
    editTimeInput.value = meeting.startTime;
    editDurationInput.value = String(meeting.durationMinutes);
    buildProjectSelect(editProjectSelect, meeting.projectId);

    editButton.addEventListener("click", () => handleMeetingEdit(meeting.id));
    deleteButton.addEventListener("click", () => handleMeetingDelete(meeting.id));
    cancelButton.addEventListener("click", handleMeetingCancelEdit);
    saveButton.addEventListener("click", () =>
      handleMeetingSave(meeting.id, editTitleInput, editTimeInput, editDurationInput, editProjectSelect)
    );

    els.meetingList.appendChild(fragment);
  });
}

function renderImportPreview() {
  if (!pendingImport) {
    els.meetingImportPreview.classList.add("hidden");
    return;
  }

  const { meetings, tasks, unparsed } = pendingImport;

  els.meetingImportPreview.classList.remove("hidden");
  els.meetingImportSummary.textContent = `即將新增 ${meetings.length} 筆會議、${tasks.length} 筆任務`;

  els.meetingImportPreviewMeetings.innerHTML = meetings
    .map((meeting) => `<li>${meeting.title}（${meeting.startTime} - ${addMinutesToTime(meeting.startTime, meeting.durationMinutes)}）</li>`)
    .join("");

  els.meetingImportPreviewTasks.innerHTML = tasks.map((task) => `<li>${task.title}</li>`).join("");

  els.meetingImportPreviewUnparsedGroup.classList.toggle("hidden", unparsed.length === 0);
  els.meetingImportPreviewUnparsed.innerHTML = unparsed.map((entry) => `<li>${entry.raw}</li>`).join("");
}

function renderProjectParentOptions() {
  buildProjectSelect(els.projectParentSelect, els.projectParentSelect.value || null, {
    placeholder: "建立為主專案",
  });
}

function renderHeatmap() {
  els.heatmapGrid.innerHTML = "";

  buildLastThirtyDays().forEach((day) => {
    const stat = state.stats.find((entry) => entry.date === day.key);
    const count = stat ? stat.completedCount : 0;
    const cell = document.createElement("div");
    cell.className = `heatmap-cell ${heatLevelClass(count)}`;
    cell.dataset.day = day.label;
    cell.dataset.count = String(count);
    cell.title = `${day.fullLabel}：${count} 顆番茄`;
    els.heatmapGrid.appendChild(cell);
  });
}

function buildProjectSelect(selectElement, selectedProjectId, options = {}) {
  const { placeholder = "未指派專案" } = options;
  const currentValue = selectedProjectId || "";
  selectElement.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = placeholder;
  selectElement.appendChild(placeholderOption);

  getTreeProjects().forEach(({ project, depth }) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = `${"— ".repeat(depth)}${project.name}`;
    option.selected = project.id === currentValue;
    selectElement.appendChild(option);
  });

  selectElement.value = currentValue;
}

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return structuredClone(initialState);
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      ...structuredClone(initialState),
      ...parsed,
      timer: {
        ...initialState.timer,
        ...parsed.timer,
      },
    };
  } catch (error) {
    return structuredClone(initialState);
  }
}

function normalizeState() {
  state.projects = state.projects.map((project) => ({
    id: project.id || crypto.randomUUID(),
    name: project.name || "未命名專案",
    parentId: project.parentId || null,
    createdAt: project.createdAt || new Date().toISOString(),
  }));

  const validProjectIds = new Set(state.projects.map((project) => project.id));

  state.projects = state.projects.map((project) => ({
    ...project,
    parentId: validProjectIds.has(project.parentId) && project.parentId !== project.id ? project.parentId : null,
  }));

  state.tasks = state.tasks.map((task) => ({
    ...task,
    projectId: validProjectIds.has(task.projectId) ? task.projectId : null,
    pomodoros: Number.isFinite(task.pomodoros) ? task.pomodoros : 0,
    priority: task.priority || null,
    status: task.status || null,
    completedAt: task.completed && !task.completedAt ? task.createdAt || new Date().toISOString() : task.completedAt,
  }));

  const validTaskIds = new Set(state.tasks.map((task) => task.id));

  state.meetings = (state.meetings || [])
    .filter((meeting) => meeting.title && meeting.startTime)
    .map((meeting) => ({
      ...meeting,
      id: meeting.id || crypto.randomUUID(),
      date: meeting.date || formatDateKey(new Date()),
      durationMinutes: Number.isFinite(meeting.durationMinutes) && meeting.durationMinutes > 0 ? meeting.durationMinutes : 1,
      projectId: validProjectIds.has(meeting.projectId) ? meeting.projectId : null,
    }));

  state.pomodoroSessions = (state.pomodoroSessions || [])
    .filter((session) => session.date)
    .map((session) => ({
      ...session,
      id: session.id || crypto.randomUUID(),
      taskId: validTaskIds.has(session.taskId) ? session.taskId : null,
    }));

  if (!validProjectIds.has(state.activeProjectId)) {
    state.activeProjectId = getRootProjects()[0]?.id || null;
  } else {
    state.activeProjectId = getRootProjectId(state.activeProjectId);
  }

  if (!state.currentTaskId || !state.tasks.some((task) => task.id === state.currentTaskId)) {
    state.currentTaskId = state.tasks.find((task) => !task.completed)?.id || state.tasks[0]?.id || null;
  }
}

function createProject(name, parentId = null) {
  return {
    id: crypto.randomUUID(),
    name,
    parentId,
    createdAt: new Date().toISOString(),
  };
}

function createTask(title, projectId = null, pomodoros = 0, completed = false, priority = null, status = null) {
  return {
    id: crypto.randomUUID(),
    title,
    completed,
    completedAt: completed ? new Date().toISOString() : null,
    pomodoros,
    createdAt: new Date().toISOString(),
    projectId,
    priority,
    status,
  };
}

function createPomodoroSession(taskId) {
  return {
    id: crypto.randomUUID(),
    taskId: taskId || null,
    date: formatDateKey(new Date()),
    completedAt: new Date().toISOString(),
  };
}

function createMeeting(title, startTime, durationMinutes, projectId = null, date = formatDateKey(new Date())) {
  return {
    id: crypto.randomUUID(),
    title,
    date,
    startTime,
    durationMinutes,
    projectId,
    createdAt: new Date().toISOString(),
  };
}

function buildInitialProjects() {
  const xumi = createProject("24C022 【Xumi】美和科技大學");
  const tasal = createProject("243017 【TASAL】維運案");
  const harbor = createProject("251028 【航港局】學習平臺");
  const ntue = createProject("239031 【北教大】特教網站");

  return [
    xumi,
    tasal,
    harbor,
    ntue,
    createProject("形象主站改版", xumi.id),
    createProject("招生頁優化", xumi.id),
    createProject("243018 後擴案", tasal.id),
    createProject("學生端改版", harbor.id),
    createProject("後台權限調整", harbor.id),
    createProject("教材匯入流程", harbor.id),
    createProject("維運續約", ntue.id),
  ];
}

function buildInitialTasks(projects) {
  const findId = (name) => projects.find((project) => project.name === name)?.id || null;

  return [
    createTask("整理首頁 sitemap 與區塊結構", findId("形象主站改版"), 2),
    createTask("確認招生頁 CTA 文案版本", findId("招生頁優化"), 0),
    createTask("盤點維運問題單優先級", findId("243017 【TASAL】維運案"), 1),
    createTask("規劃後擴案功能拆解", findId("243018 後擴案"), 0),
    createTask("整理教材匯入需求", findId("教材匯入流程"), 0),
    createTask("更新特教網站維運排程", findId("維運續約"), 1, true),
  ];
}

function getProjectById(projectId) {
  return state.projects.find((project) => project.id === projectId) || null;
}

function getChildProjects(parentId) {
  return state.projects.filter((project) => project.parentId === parentId);
}

function getRootProjects() {
  return state.projects.filter((project) => !project.parentId);
}

function getTreeProjects(parentId = null, depth = 0, visited = new Set()) {
  const projects = [];

  getChildProjects(parentId).forEach((project) => {
    if (visited.has(project.id)) {
      return;
    }

    const nextVisited = new Set(visited);
    nextVisited.add(project.id);
    projects.push({ project, depth });
    projects.push(...getTreeProjects(project.id, depth + 1, nextVisited));
  });

  return projects;
}

function getDescendantProjectIds(projectId, visited = new Set()) {
  if (visited.has(projectId)) {
    return [];
  }

  const nextVisited = new Set(visited);
  nextVisited.add(projectId);
  const descendants = [];

  getChildProjects(projectId).forEach((child) => {
    descendants.push(child.id, ...getDescendantProjectIds(child.id, nextVisited));
  });

  return descendants;
}

function getRootProjectId(projectId) {
  let current = getProjectById(projectId);
  const visited = new Set();

  while (current?.parentId && !visited.has(current.id)) {
    visited.add(current.id);
    current = getProjectById(current.parentId);
  }

  return current?.id || null;
}

function getActiveRootProject() {
  return getProjectById(getRootProjectId(state.activeProjectId));
}

function getProjectPathLabel(projectId) {
  const segments = [];
  let current = getProjectById(projectId);
  const visited = new Set();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    segments.unshift(current.name);
    current = current.parentId ? getProjectById(current.parentId) : null;
  }

  return segments.join(" / ");
}

function buildProjectDescription(project, childCount, taskCount) {
  const label = childCount > 0 ? `${childCount} 個子專案` : "尚未拆出子專案";
  return `${project.name} 目前共有 ${label}，累計 ${taskCount} 項關聯任務。你可以先從左側切換主專案，再在右側掌握拆解與執行進度。`;
}

function projectStatusText(openTaskCount, childCount) {
  if (openTaskCount === 0 && childCount === 0) {
    return "待建立";
  }
  if (openTaskCount === 0) {
    return "已清空";
  }
  if (openTaskCount <= 2) {
    return "穩定中";
  }
  return "進行中";
}

function buildLastThirtyDays() {
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));

    return {
      key: formatDateKey(date),
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      fullLabel: date.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  });
}

function heatLevelClass(count) {
  if (count >= 5) {
    return "level-3";
  }
  if (count >= 3) {
    return "level-2";
  }
  if (count >= 1) {
    return "level-1";
  }
  return "level-0";
}

function calculateStreak() {
  const days = buildLastThirtyDays().map((day) => day.key).reverse();
  let streak = 0;

  for (const day of days) {
    const stat = state.stats.find((entry) => entry.date === day);
    if (stat && stat.completedCount > 0) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function timerStatusText(status) {
  switch (status) {
    case "running":
      return "專注進行中";
    case "paused":
      return "已暫停";
    case "completed":
      return "本輪已完成";
    default:
      return "尚未開始";
  }
}

function formatDuration(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function addMinutesToTime(time, durationMinutes) {
  const totalMinutes = (timeToMinutes(time) + durationMinutes) % (24 * 60);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseDigestText(text) {
  const meetingHeaderIndex = text.indexOf("【今日會議】");
  const taskHeaderIndex = text.indexOf("【今日任務】");

  const meetingSection =
    meetingHeaderIndex === -1
      ? ""
      : text.slice(meetingHeaderIndex, taskHeaderIndex === -1 ? undefined : taskHeaderIndex);
  const taskSection = taskHeaderIndex === -1 ? "" : text.slice(taskHeaderIndex);

  const meetingResult = parseMeetingSection(meetingSection);
  const taskResult = parseTaskSection(taskSection);

  return {
    meetings: meetingResult.meetings,
    tasks: taskResult.tasks,
    unparsed: [...meetingResult.unparsed, ...taskResult.unparsed],
  };
}

function parseMeetingSection(section) {
  const lines = section.split("\n");
  const timeRangePattern = /^(\d{2}:\d{2})\s*[-–~]\s*(\d{2}:\d{2})$/;
  const titlePattern = /^\s*會議名稱[:：]\s*(.+)$/;

  const meetings = [];
  const unparsed = [];
  let current = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    const timeMatch = trimmed.match(timeRangePattern);

    if (timeMatch) {
      if (current) {
        finalizeMeetingBlock(current, meetings, unparsed);
      }
      current = { startTime: timeMatch[1], endTime: timeMatch[2], title: null, raw: [trimmed] };
      return;
    }

    if (!current) {
      return;
    }

    current.raw.push(trimmed);
    const titleMatch = trimmed.match(titlePattern);
    if (titleMatch && !current.title) {
      current.title = titleMatch[1].trim();
    }
  });

  if (current) {
    finalizeMeetingBlock(current, meetings, unparsed);
  }

  return { meetings, unparsed };
}

function finalizeMeetingBlock(block, meetings, unparsed) {
  const durationMinutes = (timeToMinutes(block.endTime) - timeToMinutes(block.startTime) + 24 * 60) % (24 * 60);

  if (!block.title || durationMinutes <= 0) {
    unparsed.push({ raw: block.raw.join(" ") });
    return;
  }

  meetings.push({ title: block.title, startTime: block.startTime, durationMinutes });
}

function parseTaskSection(section) {
  const lines = section.split("\n");
  const taskMarkerPattern = /^\[\d+#\]$/;
  const titlePattern = /^\s*任務名稱[:：]\s*(.+)$/;
  const statusPattern = /^\s*狀態[:：]\s*(.+)$/;
  const priorityPattern = /^\s*priority[:：]\s*(.+)$/i;

  const tasks = [];
  const unparsed = [];
  let current = null;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (taskMarkerPattern.test(trimmed)) {
      if (current) {
        finalizeTaskBlock(current, tasks, unparsed);
      }
      current = { title: null, status: null, priority: null, raw: [trimmed] };
      return;
    }

    if (!current) {
      return;
    }

    current.raw.push(trimmed);

    const titleMatch = trimmed.match(titlePattern);
    if (titleMatch && !current.title) {
      current.title = titleMatch[1].trim();
    }

    const statusMatch = trimmed.match(statusPattern);
    if (statusMatch && !current.status) {
      current.status = statusMatch[1].trim();
    }

    const priorityMatch = trimmed.match(priorityPattern);
    if (priorityMatch && !current.priority) {
      current.priority = priorityMatch[1].trim();
    }
  });

  if (current) {
    finalizeTaskBlock(current, tasks, unparsed);
  }

  return { tasks, unparsed };
}

function finalizeTaskBlock(block, tasks, unparsed) {
  if (!block.title) {
    unparsed.push({ raw: block.raw.join(" ") });
    return;
  }

  tasks.push({ title: block.title, status: block.status, priority: block.priority });
}

function seedStats() {
  const pattern = [0, 1, 2, 0, 3, 4, 1, 5, 2, 0, 3, 1, 0, 4, 5, 2, 1, 0, 3, 4, 2, 1, 0, 5, 4, 3, 1, 2, 0, 4];

  return pattern.map((count, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    return {
      date: formatDateKey(date),
      completedCount: count,
    };
  });
}

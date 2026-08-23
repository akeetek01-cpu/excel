$(function () {
    const endpoint = "https://excel-4c142-default-rtdb.firebaseio.com/employees";
    const $form = $("#employeeForm");
    const $formPanel = $("#formPanel");
    const $formMessage = $("#formMessage");
    const $tableMessage = $("#tableMessage");
    let employees = {};
    let simproEmployees = [];
    let simproTeams = [];
    let table;

    table = $("#employeesTable").DataTable({
        data: [],
        pageLength: 10,
        columns: [
            { data: "ID" },
            { data: "Name", defaultContent: "" },
            { data: "Email", defaultContent: "" },
            { data: "Mobile", defaultContent: "" },
            { data: "col3", defaultContent: "" },
            { data: "ManagerName", defaultContent: "" },
            { data: "TeamName", defaultContent: "" },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: function (_, type, employee) {
                    if (type !== "display") return "";
                    return `<div class="action-group">
                        <button class="button button-quiet action-button edit-employee" data-id="${escapeAttribute(employee._key)}" type="button">Edit</button>
                        <button class="button button-danger action-button delete-employee" data-id="${escapeAttribute(employee._key)}" type="button">Delete</button>
                    </div>`;
                }
            }
        ]
    });

    function escapeAttribute(value) {
        return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function showMessage($element, message, isError) {
        $element.text(message).toggleClass("error", Boolean(isError));
    }

    function normalizeEmployee(key, employee) {
        return { ...employee, _key: key, ID: employee.ID ?? key };
    }

    function refreshTable() {
        const rows = Object.entries(employees).map(([key, employee]) => normalizeEmployee(key, employee));
        table.clear().rows.add(rows).draw();
        $("#recordCount").text(`${rows.length} ${rows.length === 1 ? "employee" : "employees"}`);
    }

    async function loadEmployees() {
        showMessage($tableMessage, "Loading employee records...");
        try {
            const response = await fetch(`${endpoint}.json`);
            if (!response.ok) throw new Error(`Firebase returned ${response.status}`);
            employees = await response.json() || {};
            refreshTable();
            if (simproEmployees.length) refreshEmployeeOptions();
            showMessage($tableMessage, "");
        } catch (error) {
            showMessage($tableMessage, `Unable to load employees: ${error.message}`, true);
            $("#recordCount").text("Unavailable");
        }
    }

    async function loadSimproEmployees() {
        try {
            const response = await fetch("/api/simpro/employees");
            if (!response.ok) throw new Error(`Simpro returned ${response.status}`);
            const data = await response.json();
            const records = Array.isArray(data) ? data : data.data;
            if (!Array.isArray(records)) throw new Error("Unexpected employee response");
            simproEmployees = records;
            refreshEmployeeOptions();
            refreshPickerOptions("#managerSearch", simproEmployees, true);
            $("#employeeSearch, #managerSearch").prop("disabled", simproEmployees.length === 0);
            if (!simproEmployees.length) showMessage($tableMessage, "No Simpro employees were returned.", true);
        } catch (error) {
            simproEmployees = [];
            $("#employeeSearch, #managerSearch").prop("disabled", true);
            showMessage($tableMessage, `Simpro employee search unavailable: ${error.message}`, true);
        }
    }

    async function loadSimproTeams() {
        try {
            const response = await fetch("/api/simpro/teams");
            if (!response.ok) throw new Error(`Simpro returned ${response.status}`);
            const data = await response.json();
            const records = Array.isArray(data) ? data : data.data;
            if (!Array.isArray(records)) throw new Error("Unexpected team response");
            simproTeams = records;
            refreshTeamOptions();
            const editingEmployee = $("#originalId").val() ? employees[$("#originalId").val()] : null;
            if (editingEmployee) restoreTeamSelection(editingEmployee);
            $("#teamSearch").prop("disabled", simproTeams.length === 0);
            if (!simproTeams.length) showMessage($tableMessage, "No Simpro teams were returned.", true);
        } catch (error) {
            simproTeams = [];
            $("#teamSearch").prop("disabled", true);
            showMessage($tableMessage, `Simpro team search unavailable: ${error.message}`, true);
        }
    }

    function employeeEmail(employee) {
        return employee.PrimaryContact?.Email || employee.Email || "";
    }

    function employeeMobile(employee) {
        return employee.PrimaryContact?.CellPhone || employee.Mobile || "";
    }

    function employeeOptionLabel(employee) {
        const email = employeeEmail(employee);
        return `${employee.Name || "Unnamed employee"} · ID ${employee.ID}${email ? ` · ${email}` : ""}`;
    }

    function firebaseEmployeeIds() {
        return new Set(Object.entries(employees).flatMap(([key, employee]) => [
            String(key),
            employee?.ID == null ? null : String(employee.ID)
        ].filter(Boolean)));
    }

    function refreshEmployeeOptions() {
        const existingIds = firebaseEmployeeIds();
        const editingKey = $("#originalId").val();
        const editingEmployee = editingKey ? employees[editingKey] : null;
        const editingId = editingEmployee ? (editingEmployee.ID ?? editingKey) : "";
        const records = editingEmployee
            ? simproEmployees.filter(employee => String(employee.ID) === String(editingId))
            : simproEmployees.filter(employee => !existingIds.has(String(employee.ID)));
        const currentEmployee = editingEmployee && records.length === 0
            ? [{
                ID: editingId,
                Name: editingEmployee.Name,
                Email: editingEmployee.Email,
                Mobile: editingEmployee.Mobile,
                Position: editingEmployee.col3
            }]
            : records;
        refreshPickerOptions("#employeeSearch", currentEmployee, false);
    }

    function refreshPickerOptions(selector, records, managersOnly) {
        const $select = $(selector);
        const source = managersOnly
            ? records.filter(employee => String(employee.Position || "").toLowerCase().includes("manager"))
            : records;
        $select.empty().append($("<option>", {
            value: "",
            text: managersOnly ? "Search manager name, email, or ID" : "Search name, email, or ID"
        }));
        source.forEach(employee => $select.append($("<option>", {
            value: employee.ID,
            text: employeeOptionLabel(employee)
        })));
        const api = typeof hcgSelect === "function" ? hcgSelect(selector, { maxResults: 10 }) : null;
        if (api && typeof api.refresh === "function") api.refresh();
    }

    function refreshTeamOptions() {
        const $select = $("#teamSearch");
        $select.empty().append($("<option>", {
            value: "",
            text: "Search team by name or ID"
        }));
        simproTeams.forEach(team => $select.append($("<option>", {
            value: team.ID,
            text: `${team.Name || "Unnamed team"} · ID ${team.ID}`
        })));
        const api = typeof hcgSelect === "function" ? hcgSelect("#teamSearch", { maxResults: 10 }) : null;
        if (api && typeof api.refresh === "function") api.refresh();
    }

    function bindPicker(inputSelector, managersOnly, onSelect) {
        const $input = $(inputSelector);
        $input.on("change", function () {
            const selected = simproEmployees.find(employee => String(employee.ID) === String($input.val()));
            if (managersOnly && !selected) $("#managerId, #managerName").val("");
            if (selected) onSelect(selected);
        });
    }

    function selectedEmployee(employeeId) {
        return simproEmployees.find(employee => String(employee.ID) === String(employeeId));
    }

    function bindTeamPicker() {
        $("#teamSearch").on("change", function () {
            const selected = simproTeams.find(team => String(team.ID) === String($(this).val()));
            $("#teamId").val(selected ? selected.ID : "");
            $("#teamName").val(selected ? selected.Name || "" : "");
        });
    }

    function restoreTeamSelection(employee) {
        const savedTeam = employee.Team || employee.team || {};
        const teamId = employee.TeamId ?? employee.TeamID ?? employee.teamId ?? employee["Team ID"] ?? employee["Team Id"] ?? savedTeam.ID ?? "";
        const matchingTeam = simproTeams.find(team => String(team.ID) === String(teamId));
        const teamName = employee.TeamName ?? employee.teamName ?? employee["Team Name"] ?? savedTeam.Name ?? matchingTeam?.Name ?? "";
        $("#teamId").val(teamId);
        $("#teamName").val(teamName);
        $("#teamSearch").val(teamId);
        if (matchingTeam) {
            $("#teamSearch").trigger("change");
        }
    }

    function setEmployeeFromSimpro(employee) {
        showMessage($formMessage, "");
        $("#employeeId").val(employee.ID);
        $("#employeeName").val(employee.Name || "");
        $("#employeeEmail").val(employeeEmail(employee));
        $("#employeeMobile").val(employeeMobile(employee));
        $("#employeeRole").val(employee.Position || "");
        $("#employeeSearch").val(employee.ID);
    }

    function setManagerFromSimpro(employee) {
        $("#managerId").val(employee.ID);
        $("#managerName").val(employee.Name || "");
        $("#managerSearch").val(employee.ID);
    }

    function setPasswordVisibility(isVisible) {
        $("#employeePassword").attr("type", isVisible ? "text" : "password");
        $("#togglePasswordButton")
            .text(isVisible ? "Hide" : "Show")
            .attr("aria-label", `${isVisible ? "Hide" : "Show"} password`)
            .attr("aria-pressed", String(isVisible));
    }

    function resetForm() {
        $form[0].reset();
        $("#originalId").val("");
        $("#employeeId").prop("disabled", false);
        $("#employeeSearch").prop("disabled", false);
        $("#employeePassword").prop("required", true);
        $("#isAccountActive").prop("checked", false);
        setPasswordVisibility(false);
        $("#employeeSearch, #managerSearch, #teamSearch").val("").trigger("change");
        refreshEmployeeOptions();
        $("#formTitle").text("Add employee");
        showMessage($formMessage, "");
    }

    function openForm(employee, employeeKey) {
        $formPanel[0].scrollIntoView({ behavior: "smooth", block: "start" });
        if (!employee) {
            resetForm();
            return;
        }
        $("#originalId").val(employeeKey ?? employee._key ?? employee.ID);
        refreshEmployeeOptions();
        const employeeId = employee.ID ?? employee._key;
        $("#employeeId").val(employeeId).prop("disabled", false);
        $("#employeeSearch").val(employeeId).trigger("change");
        $("#employeeSearch").prop("disabled", true);
        $("#employeeName").val(employee.Name || "");
        $("#employeeEmail").val(employee.Email || "");
        $("#employeeMobile").val(employee.Mobile ?? "");
        $("#employeeRole").val(employee.col3 || "");
        $("#employeePassword").val(employee.Password || "").prop("required", false);
        $("#isAccountActive").prop("checked", employee.isAccountActive ?? false);
        $("#managerId").val(employee.ManagerID ?? "");
        $("#managerName").val(employee.ManagerName || "");
        $("#managerSearch").val(employee.ManagerID ?? "");
        $("#teamId").val(employee.TeamId ?? "");
        $("#teamName").val(employee.TeamName || "");
        $("#formTitle").text("Edit Employee");
        if (selectedEmployee(employee.ManagerID)) $("#managerSearch").trigger("change");
        restoreTeamSelection(employee);
        showMessage($formMessage, "Leave password blank to keep the current password.");
    }

    function formEmployee() {
        const selectedTeam = simproTeams.find(team => String(team.ID) === String($("#teamSearch").val()));
        const employee = {
            ID: Number($("#employeeId").val()),
            Name: $("#employeeName").val().trim(),
            Email: $("#employeeEmail").val().trim(),
            Mobile: $("#employeeMobile").val().trim(),
            col3: $("#employeeRole").val().trim(),
            ManagerID: $("#managerId").val() ? Number($("#managerId").val()) : null,
            ManagerName: $("#managerName").val().trim(),
            TeamId: selectedTeam ? Number(selectedTeam.ID) : ($("#teamId").val() ? Number($("#teamId").val()) : null),
            TeamName: selectedTeam ? (selectedTeam.Name || "") : $("#teamName").val().trim(),
            isAccountActive: $("#isAccountActive").prop("checked")
        };
        const password = $("#employeePassword").val();
        if (password) employee.Password = password;
        return employee;
    }

    $form.on("submit", async function (event) {
        event.preventDefault();
        const originalId = $("#originalId").val();
        const key = originalId || $("#employeeId").val();
        const employee = formEmployee();
        if (!originalId && !employee.Password) {
            showMessage($formMessage, "Password is required for a new employee.", true);
            $("#employeePassword").trigger("focus");
            return;
        }
        if (!originalId && (!employee.ManagerID || !employee.ManagerName || !employee.TeamId || !employee.TeamName)) {
            const missingManager = !employee.ManagerID || !employee.ManagerName;
            const missingTeam = !employee.TeamId || !employee.TeamName;
            const message = missingManager && missingTeam
                ? "Manager and team are required for a new employee."
                : missingManager
                    ? "Manager is required for a new employee."
                    : "Team is required for a new employee.";
            showMessage($formMessage, message, true);
            return;
        }
        if (!key || !Number.isInteger(employee.ID) || employee.ID <= 0 || !employee.Name || !employee.Email) {
            showMessage($formMessage, "Select an employee and complete the required fields.", true);
            return;
        }
        if (originalId && originalId !== String(key) && employees[key]) {
            showMessage($formMessage, "That employee ID is already in use.", true);
            return;
        }
        showMessage($formMessage, "Saving employee...");
        try {
            const existing = originalId ? employees[originalId] : null;
            const timestamp = new Date().toISOString();
            if (existing) {
                employee.modifiedDate = timestamp;
                employee.createdDate = existing.createdDate || timestamp;
            } else {
                employee.createdDate = timestamp;
            }
            if (existing && !employee.Password && existing.Password) employee.Password = existing.Password;
            const response = await fetch(`${endpoint}/${encodeURIComponent(key)}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(employee)
            });
            if (!response.ok) throw new Error(`Firebase returned ${response.status}`);
            if (originalId && originalId !== String(key)) {
                const removePrevious = await fetch(`${endpoint}/${encodeURIComponent(originalId)}.json`, { method: "DELETE" });
                if (!removePrevious.ok) throw new Error(`Firebase returned ${removePrevious.status} while removing the previous record`);
            }
            resetForm();
            await loadEmployees();
            showMessage($tableMessage, "Employee saved successfully.");
        } catch (error) {
            showMessage($formMessage, `Unable to save employee: ${error.message}`, true);
        }
    });

    $("#employeesTable").on("click", ".edit-employee", function () {
        showMessage($formMessage, "");
        const employeeKey = String($(this).attr("data-id"));
        openForm(employees[employeeKey], employeeKey);
    });

    $("#employeesTable").on("click", ".delete-employee", async function () {
        showMessage($formMessage, "");
        const key = String($(this).data("id"));
        const employee = employees[key];
        if (!employee || !window.confirm(`Delete ${employee.Name || "this employee"}? This cannot be undone.`)) return;
        showMessage($tableMessage, "Deleting employee...");
        try {
            const response = await fetch(`${endpoint}/${encodeURIComponent(key)}.json`, { method: "DELETE" });
            if (!response.ok) throw new Error(`Firebase returned ${response.status}`);
            if ($("#originalId").val() === key) resetForm();
            await loadEmployees();
            showMessage($tableMessage, "Employee deleted successfully.");
        } catch (error) {
            showMessage($tableMessage, `Unable to delete employee: ${error.message}`, true);
        }
    });

    $("#newEmployeeButton").on("click", function () { openForm(); });
    $("#cancelButton").on("click", resetForm);
    $("#togglePasswordButton").on("click", function () {
        setPasswordVisibility($("#employeePassword").attr("type") === "password");
    });
    bindPicker("#employeeSearch", false, setEmployeeFromSimpro);
    bindPicker("#managerSearch", true, setManagerFromSimpro);
    bindTeamPicker();
    $("#employeeSearch, #managerSearch, #teamSearch").prop("disabled", true);
    loadEmployees();
    loadSimproEmployees();
    loadSimproTeams();
});
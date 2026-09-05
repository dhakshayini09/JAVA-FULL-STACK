let tx = [];

const $ = (id) => document.getElementById(id);

const money = (n) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(Number(n) || 0);

const today = new Date().toISOString().slice(0, 10);


/* =========================
   LOAD TRANSACTIONS
========================= */

async function load() {
    try {
        const response = await fetch("/api/transactions");

        if (!response.ok) {
            throw new Error("Unable to load transactions");
        }

        tx = await response.json();

        // Sort newest first
        tx.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });

        render();

    } catch (error) {
        console.error("Load error:", error);
    }
}


/* =========================
   RENDER DASHBOARD
========================= */

function render() {

    const income = tx
        .filter(x => x.type === "INCOME")
        .reduce((sum, x) => sum + Number(x.amount), 0);

    const expense = tx
        .filter(x => x.type === "EXPENSE")
        .reduce((sum, x) => sum + Number(x.amount), 0);

    const balance = income - expense;

    const balanceElement = $("balance");
    const incomeElement = $("income");
    const expenseElement = $("expense");

    if (balanceElement) {
        balanceElement.textContent = money(balance);
    }

    if (incomeElement) {
        incomeElement.textContent = money(income);
    }

    if (expenseElement) {
        expenseElement.textContent = money(expense);
    }

    renderRecent();
    renderTable();
    drawChart();
}


/* =========================
   RECENT TRANSACTIONS
========================= */

function renderRecent() {

    const recent = $("recent");

    if (!recent) {
        return;
    }

    const data = tx.slice(0, 5);

    recent.innerHTML = data.length
        ? data.map(x => `
            <div class="row">

                <div>
                    <b>${esc(x.description)}</b>
                    <small>
                        ${esc(x.category)} · ${x.date}
                    </small>
                </div>

                <div class="amt ${x.type === "INCOME" ? "green" : "red"}">
                    ${x.type === "INCOME" ? "+" : "−"}${money(x.amount)}
                </div>

            </div>
        `).join("")

        : '<p class="muted">No transactions yet. Add your first one!</p>';
}


/* =========================
   TRANSACTION TABLE
========================= */

function renderTable() {

    const tbody = $("tbody");

    if (!tbody) {
        return;
    }

    const searchElement = $("search");

    const search = searchElement
        ? searchElement.value.toLowerCase()
        : "";

    const data = tx.filter(x =>
        (
            String(x.description || "") +
            String(x.category || "") +
            String(x.type || "")
        )
            .toLowerCase()
            .includes(search)
    );

    tbody.innerHTML = data.length

        ? data.map(x => `
            <tr>

                <td>${x.date}</td>

                <td>
                    <b>${esc(x.description)}</b>
                </td>

                <td>
                    ${esc(x.category)}
                </td>

                <td>
                    ${
                        x.type === "INCOME"
                            ? '<span class="green">Income</span>'
                            : '<span class="red">Expense</span>'
                    }
                </td>

                <td class="${x.type === "INCOME" ? "green" : "red"}">
                    <b>
                        ${x.type === "INCOME" ? "+" : "−"}
                        ${money(x.amount)}
                    </b>
                </td>

                <td>

                    <button
                        type="button"
                        class="edit-btn"
                        data-id="${x.id}">
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        data-id="${x.id}">
                        Delete
                    </button>

                </td>

            </tr>
        `).join("")

        : `
            <tr>
                <td colspan="6"
                    style="text-align:center;padding:35px">
                    No transactions found.
                </td>
            </tr>
        `;

    // EDIT BUTTONS
    tbody.querySelectorAll(".edit-btn").forEach(button => {

        button.addEventListener("click", function () {

            const id = this.dataset.id;

            editTx(id);

        });

    });


    // DELETE BUTTONS
    tbody.querySelectorAll(".delete-btn").forEach(button => {

        button.addEventListener("click", function () {

            const id = this.dataset.id;

            delTx(id);

        });

    });
}


/* =========================
   CHART
========================= */

function drawChart() {

    const canvas = $("chart");

    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return;
    }

    const categories = {};

    tx
        .filter(x => x.type === "EXPENSE")
        .forEach(x => {

            const category = x.category || "Other";

            categories[category] =
                (categories[category] || 0) +
                Number(x.amount);

        });


    const data = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);


    const total =
        data.reduce((sum, x) => sum + x[1], 0);


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    if (!total) {

        ctx.font = "15px system-ui";
        ctx.fillStyle = "#8a93a2";
        ctx.textAlign = "center";

        ctx.fillText(
            "Add expenses to see your spending chart",
            canvas.width / 2,
            130
        );

        const legend = $("legend");

        if (legend) {
            legend.innerHTML = "";
        }

        return;
    }


    const cx = 250;
    const cy = 125;
    const radius = 85;

    let start = -Math.PI / 2;


    const colors = [
        "#6d5dfc",
        "#35b99a",
        "#f2ad4b",
        "#e85d75",
        "#4c9aff",
        "#9b7bdb"
    ];


    data.forEach((item, index) => {

        const end =
            start +
            (item[1] / total) *
            Math.PI *
            2;


        ctx.beginPath();

        ctx.moveTo(cx, cy);

        ctx.arc(
            cx,
            cy,
            radius,
            start,
            end
        );

        ctx.closePath();

        ctx.fillStyle =
            colors[index % colors.length];

        ctx.fill();

        start = end;

    });


    // White center
    ctx.beginPath();

    ctx.arc(
        cx,
        cy,
        48,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#fff";

    ctx.fill();


    // Total
    ctx.fillStyle = "#172033";
    ctx.font = "bold 17px system-ui";
    ctx.textAlign = "center";

    ctx.fillText(
        money(total),
        cx,
        cy + 5
    );


    const legend = $("legend");

    if (legend) {

        legend.innerHTML =
            data.map((item, index) => `
                <span>
                    <i style="
                        background:
                        ${colors[index % colors.length]}
                    "></i>

                    ${esc(item[0])}
                </span>
            `).join("");

    }
}


/* =========================
   OPEN ADD / EDIT MODAL
========================= */

function openAdd(transaction = null) {

    const modal = $("modal");

    if (!modal) {
        console.error("Modal element not found");
        return;
    }


    // SHOW MODAL
    modal.classList.remove("hidden");


    const modalTitle = $("modalTitle");

    if (modalTitle) {

        modalTitle.textContent =
            transaction
                ? "Edit transaction"
                : "Add transaction";

    }


    const id = $("id");
    const type = $("type");
    const amount = $("amount");
    const category = $("category");
    const description = $("description");
    const date = $("date");


    if (id) {
        id.value =
            transaction?.id || "";
    }


    if (type) {
        type.value =
            transaction?.type || "EXPENSE";
    }


    if (amount) {
        amount.value =
            transaction?.amount || "";
    }


    if (category) {
        category.value =
            transaction?.category || "Food";
    }


    if (description) {
        description.value =
            transaction?.description || "";
    }


    if (date) {
        date.value =
            transaction?.date || today;
    }
}


/* =========================
   CLOSE MODAL
========================= */

function closeModal() {

    const modal = $("modal");

    if (!modal) {
        console.error("Modal element not found");
        return;
    }

    modal.classList.add("hidden");
}


/* =========================
   SAVE TRANSACTION
========================= */

async function saveTransaction(event) {

    event.preventDefault();


    const idElement = $("id");
    const typeElement = $("type");
    const amountElement = $("amount");
    const categoryElement = $("category");
    const descriptionElement = $("description");
    const dateElement = $("date");


    const id =
        idElement
            ? idElement.value
            : "";


    const body = {

        type:
            typeElement
                ? typeElement.value
                : "EXPENSE",

        amount:
            amountElement
                ? Number(amountElement.value)
                : 0,

        category:
            categoryElement
                ? categoryElement.value
                : "Other",

        description:
            descriptionElement
                ? descriptionElement.value.trim()
                : "",

        date:
            dateElement
                ? dateElement.value
                : today
    };


    /* VALIDATE AMOUNT */

    if (!body.amount || body.amount <= 0) {

        alert("Please enter a valid amount.");

        return;
    }


    /* VALIDATE DESCRIPTION */

    if (!body.description) {

        alert("Please enter a description.");

        return;
    }


    try {

        const url =
            "/api/transactions" +
            (id
                ? "/" + id
                : "");


        const response =
            await fetch(
                url,
                {
                    method:
                        id
                            ? "PUT"
                            : "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(body)
                }
            );


        if (!response.ok) {

            throw new Error(
                "Save failed: " +
                response.status
            );

        }


        closeModal();

        await load();


    } catch (error) {

        console.error(
            "Save error:",
            error
        );

        alert(
            "Could not save transaction."
        );

    }
}


/* =========================
   DELETE TRANSACTION
========================= */

async function delTx(id) {

    const confirmed =
        confirm(
            "Delete this transaction?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/transactions/" + id,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Delete failed"
            );

        }


        await load();


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );

        alert(
            "Could not delete transaction."
        );

    }
}


/* =========================
   EDIT TRANSACTION
========================= */

function editTx(id) {

    const transaction =
        tx.find(
            x =>
                Number(x.id) ===
                Number(id)
        );


    if (transaction) {

        openAdd(transaction);

    } else {

        console.error(
            "Transaction not found:",
            id
        );

    }
}


/* =========================
   HTML ESCAPE
========================= */

function esc(value) {

    return String(
        value ?? ""
    ).replace(
        /[&<>'"]/g,

        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        }[character])
    );
}


/* =========================
   START APPLICATION
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "FinTrack JavaScript loaded successfully"
        );


        /* -------------------------
           ADD BUTTON
        ------------------------- */

        const openButton =
            $("openAdd");

        if (openButton) {

            openButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    openAdd();

                }
            );

        }


        /* -------------------------
           CLOSE BUTTON
        ------------------------- */

        const closeButton =
            $("close");

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    closeModal();

                }
            );

        }


        /* -------------------------
           CANCEL BUTTON
        ------------------------- */

        const cancelButton =
            $("cancel");

        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    closeModal();

                }
            );

        }


        /* -------------------------
           FORM
        ------------------------- */

        const form =
            $("form");

        if (form) {

            form.addEventListener(
                "submit",
                saveTransaction
            );

        }


        /* -------------------------
           SEARCH
        ------------------------- */

        const search =
            $("search");

        if (search) {

            search.addEventListener(
                "input",
                renderTable
            );

        }


        /* -------------------------
           MODAL BACKGROUND
        ------------------------- */

        const modal =
            $("modal");

        if (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        modal
                    ) {

                        closeModal();

                    }

                }
            );

        }


        /* -------------------------
           NAVIGATION
        ------------------------- */

        document
            .querySelectorAll(
                "[data-page]"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            document
                                .querySelectorAll(
                                    ".page"
                                )
                                .forEach(
                                    function (page) {

                                        page.classList
                                            .add("hidden");

                                    }
                                );


                            const page =
                                $(
                                    button
                                        .dataset
                                        .page
                                );


                            if (page) {

                                page.classList
                                    .remove("hidden");

                            }


                            document
                                .querySelectorAll(
                                    "nav button"
                                )
                                .forEach(
                                    function (nav) {

                                        nav.classList
                                            .remove(
                                                "active"
                                            );

                                    }
                                );


                            if (
                                button.closest("nav")
                            ) {

                                button.classList
                                    .add("active");

                            }

                        }
                    );

                }
            );


        /* -------------------------
           LOAD DATA
        ------------------------- */

        load();

    }
);

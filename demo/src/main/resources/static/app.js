let tx = [];

const $ = id => document.getElementById(id);

const money = n =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(Number(n) || 0);

const today = new Date().toISOString().slice(0, 10);


/* LOAD TRANSACTIONS */

async function load() {
    try {
        const response = await fetch("/api/transactions");

        if (!response.ok) {
            throw new Error("Unable to load transactions");
        }

        tx = await response.json();
        render();

    } catch (error) {
        console.error(error);
    }
}


/* RENDER DASHBOARD */

function render() {

    const income = tx
        .filter(x => x.type === "INCOME")
        .reduce((sum, x) => sum + Number(x.amount), 0);

    const expense = tx
        .filter(x => x.type === "EXPENSE")
        .reduce((sum, x) => sum + Number(x.amount), 0);

    $("balance").textContent = money(income - expense);
    $("income").textContent = money(income);
    $("expense").textContent = money(expense);

    renderRecent();
    renderTable();
    drawChart();
}


/* RECENT TRANSACTIONS */

function renderRecent() {

    const data = tx.slice(0, 5);

    $("recent").innerHTML = data.length
        ? data.map(x => `
            <div class="row">
                <div>
                    <b>${esc(x.description)}</b>
                    <small>${esc(x.category)} · ${x.date}</small>
                </div>

                <div class="amt ${x.type === "INCOME" ? "green" : "red"}">
                    ${x.type === "INCOME" ? "+" : "−"}${money(x.amount)}
                </div>
            </div>
        `).join("")
        : '<p class="muted">No transactions yet. Add your first one!</p>';
}


/* TRANSACTION TABLE */

function renderTable() {

    const search =
        ($("search")?.value || "").toLowerCase();

    const data = tx.filter(x =>
        (x.description + x.category + x.type)
            .toLowerCase()
            .includes(search)
    );

    $("tbody").innerHTML = data.length
        ? data.map(x => `
            <tr>
                <td>${x.date}</td>
                <td><b>${esc(x.description)}</b></td>
                <td>${esc(x.category)}</td>

                <td>
                    ${x.type === "INCOME"
                        ? '<span class="green">Income</span>'
                        : '<span class="red">Expense</span>'}
                </td>

                <td class="${x.type === "INCOME" ? "green" : "red"}">
                    <b>
                        ${x.type === "INCOME" ? "+" : "−"}${money(x.amount)}
                    </b>
                </td>

                <td>
                    <button type="button" onclick="editTx(${x.id})">
                        Edit
                    </button>

                    <button type="button" onclick="delTx(${x.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `).join("")
        : '<tr><td colspan="6" style="text-align:center;padding:35px">No transactions found.</td></tr>';
}


/* CHART */

function drawChart() {

    const canvas = $("chart");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const categories = {};

    tx
        .filter(x => x.type === "EXPENSE")
        .forEach(x => {
            categories[x.category] =
                (categories[x.category] || 0) +
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

        $("legend").innerHTML = "";

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
            (item[1] / total) * Math.PI * 2;

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

        ctx.fillStyle = colors[index];
        ctx.fill();

        start = end;
    });

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

    ctx.fillStyle = "#172033";
    ctx.font = "bold 17px system-ui";
    ctx.textAlign = "center";

    ctx.fillText(
        money(total),
        cx,
        cy + 5
    );

    $("legend").innerHTML =
        data.map((item, index) => `
            <span>
                <i style="background:${colors[index]}"></i>
                ${esc(item[0])}
            </span>
        `).join("");
}


/* OPEN ADD TRANSACTION */

function openAdd(transaction) {

    $("modal").classList.remove("hidden");

    $("modalTitle").textContent =
        transaction
            ? "Edit transaction"
            : "Add transaction";

    $("id").value =
        transaction?.id || "";

    $("type").value =
        transaction?.type || "EXPENSE";

    $("amount").value =
        transaction?.amount || "";

    $("category").value =
        transaction?.category || "Food";

    $("description").value =
        transaction?.description || "";

    $("date").value =
        transaction?.date || today;
}


/* CLOSE POPUP */

function closeModal() {
    $("modal").classList.add("hidden");
}


/* SAVE TRANSACTION */

async function saveTransaction(event) {

    event.preventDefault();

    const id = $("id").value;

    const body = {
        type: $("type").value,
        amount: Number($("amount").value),
        category: $("category").value,
        description: $("description").value,
        date: $("date").value
    };

    if (!body.amount || body.amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    if (!body.description.trim()) {
        alert("Please enter a description.");
        return;
    }

    try {

        const response = await fetch(
            "/api/transactions" +
            (id ? "/" + id : ""),
            {
                method: id ? "PUT" : "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(body)
            }
        );

        if (!response.ok) {
            throw new Error("Save failed");
        }

        closeModal();

        await load();

    } catch (error) {

        console.error(error);

        alert("Could not save transaction.");
    }
}


/* DELETE */

async function delTx(id) {

    if (!confirm("Delete this transaction?")) {
        return;
    }

    try {

        await fetch(
            "/api/transactions/" + id,
            {
                method: "DELETE"
            }
        );

        await load();

    } catch (error) {

        console.error(error);

        alert("Could not delete transaction.");
    }
}


/* EDIT */

function editTx(id) {

    const transaction =
        tx.find(x => Number(x.id) === Number(id));

    if (transaction) {
        openAdd(transaction);
    }
}


/* HTML ESCAPE */

function esc(value) {

    return String(value ?? "").replace(
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


/* START EVERYTHING */

window.addEventListener("load", function () {

    /* ADD BUTTON */

    $("openAdd").onclick = function () {
        openAdd();
    };


    /* CLOSE BUTTON */

    $("close").onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        closeModal();
    };


    /* CANCEL BUTTON */

    $("cancel").onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        closeModal();
    };


    /* FORM */

    $("form").onsubmit = saveTransaction;


    /* SEARCH */

    $("search").oninput = renderTable;


    /* NAVIGATION */

    document.querySelectorAll("[data-page]")
        .forEach(button => {

            button.onclick = function () {

                document
                    .querySelectorAll(".page")
                    .forEach(page =>
                        page.classList.add("hidden")
                    );

                const page =
                    $(button.dataset.page);

                if (page) {
                    page.classList.remove("hidden");
                }

                document
                    .querySelectorAll("nav button")
                    .forEach(nav =>
                        nav.classList.remove("active")
                    );

                if (button.closest("nav")) {
                    button.classList.add("active");
                }
            };
        });


    /* CLICK OUTSIDE POPUP */

    $("modal").onclick = function (event) {

        if (event.target === $("modal")) {
            closeModal();
        }
    };


    /* LOAD DATA */

    load();

});

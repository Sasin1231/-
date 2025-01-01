document.addEventListener("DOMContentLoaded", () => {
    const transactionForm = document.getElementById("transactionForm");
    const transactionList = document.getElementById("transactionList");
    const totalIncome = document.getElementById("totalIncome");
    const totalExpense = document.getElementById("totalExpense");
    const balance = document.getElementById("balance");
    const filterButton = document.getElementById("filterButton");
    const filterMonth = document.getElementById("filterMonth");

    let transactions = []; // เก็บรายการทั้งหมด

    // ฟังก์ชันอัปเดตข้อมูลสรุป
    function updateSummary(filteredTransactions = transactions) {
        const income = filteredTransactions
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = filteredTransactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0);
        totalIncome.textContent = income.toFixed(2);
        totalExpense.textContent = expense.toFixed(2);
        balance.textContent = (income - expense).toFixed(2);
    }

    // ฟังก์ชันเพิ่มรายการในตาราง
    function renderTransactions(filteredTransactions = transactions) {
        transactionList.innerHTML = ""; // ล้างตาราง
        filteredTransactions.forEach((transaction, index) => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${transaction.type === "income" ? "รายรับ" : "รายจ่าย"}</td>
                <td>${transaction.name}</td>
                <td>${transaction.amount.toFixed(2)}</td>
                <td>${transaction.transaction_date}</td>
                <td>
                    <button onclick="deleteTransaction(${index})">ลบ</button>
                </td>
            `;
            transactionList.appendChild(row);
        });
    }

    // ฟังก์ชันลบรายการ
    window.deleteTransaction = (index) => {
        transactions.splice(index, 1);
        renderTransactions();
        updateSummary();
    };

    // ฟังก์ชันกรองรายการตามเดือน
    function filterTransactionsByMonth(month) {
        if (!month) return transactions; // ถ้าไม่มีเดือนที่เลือก แสดงรายการทั้งหมด
        return transactions.filter((t) => t.transaction_date.startsWith(month));
    }

    // จัดการการกรองเมื่อคลิกปุ่ม "ค้นหา"
    filterButton.addEventListener("click", () => {
        const month = filterMonth.value; // รูปแบบ: YYYY-MM
        const filteredTransactions = filterTransactionsByMonth(month);
        renderTransactions(filteredTransactions);
        updateSummary(filteredTransactions);
    });

    // จัดการการเพิ่มข้อมูลใหม่
    transactionForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(transactionForm);
        const transaction = {
            type: formData.get("type"),
            name: formData.get("name"),
            amount: parseFloat(formData.get("amount")),
            transaction_date: formData.get("transaction_date"),
        };
        transactions.push(transaction);
        transactionForm.reset();
        renderTransactions();
        updateSummary();
    });
});

// ดึงข้อมูลจาก API ตามเดือน
async function fetchTransactionsByMonth(month) {
    try {
        const response = await fetch(`/transactions?month=${month}`);
        const data = await response.json();
        renderTransactions(data); // แสดงผลรายการในตาราง
        updateSummary(data);      // อัปเดตสรุปยอด
    } catch (error) {
        console.error("Error fetching transactions:", error.message);
    }
}

// เรียกใช้งานเมื่อกดปุ่มค้นหา
filterButton.addEventListener("click", () => {
    const month = filterMonth.value;
    if (month) {
        fetchTransactionsByMonth(month);
    }
});
function calculateMonthlySummary(transactions) {
    const summary = {};

    transactions.forEach((transaction) => {
        const month = transaction.transaction_date.slice(0, 7); // รูปแบบ YYYY-MM
        if (!summary[month]) {
            summary[month] = { income: 0, expense: 0 };
        }
        if (transaction.type === "income") {
            summary[month].income += transaction.amount;
        } else if (transaction.type === "expense") {
            summary[month].expense += transaction.amount;
        }
    });

    // แสดงผลสรุปรายเดือน
    const monthlySummary = document.getElementById("monthlySummary");
    monthlySummary.innerHTML = "";

    Object.keys(summary).forEach((month) => {
        const income = summary[month].income.toFixed(2);
        const expense = summary[month].expense.toFixed(2);
        const balance = (summary[month].income - summary[month].expense).toFixed(2);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${month}</td>
            <td>${income}</td>
            <td>${expense}</td>
            <td>${balance}</td>
        `;
        monthlySummary.appendChild(row);
    });
}

transactionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(transactionForm);
    const transaction = {
        type: formData.get("type"),
        name: formData.get("name"),
        amount: parseFloat(formData.get("amount")),
        transaction_date: formData.get("transaction_date"),
    };
    transactions.push(transaction);
    transactionForm.reset();
    renderTransactions();
    updateSummary();
    calculateMonthlySummary(transactions); // อัปเดตสรุปรายเดือน
});

window.deleteTransaction = (index) => {
    transactions.splice(index, 1);
    renderTransactions();
    updateSummary();
    calculateMonthlySummary(transactions); // อัปเดตสรุปรายเดือน
};

const API_URL = 'http://localhost:3000';

// ดึงข้อมูลทั้งหมด
async function fetchTransactions() {
    const response = await fetch(`${API_URL}/transactions`);
    const data = await response.json();
    renderTransactions(data);
}

// ดึงข้อมูลตามเดือน
async function fetchTransactionsByMonth(month) {
    const response = await fetch(`${API_URL}/transactions/${month}`);
    const data = await response.json();
    renderTransactions(data);
}

// ส่งข้อมูลใหม่ไปยังฐานข้อมูล
async function addTransaction(transaction) {
    await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
    });
    fetchTransactions();
}

// ลบรายการ
async function deleteTransaction(id) {
    await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
    });
    fetchTransactions();
}

// ฟังก์ชันค้นหาตามเดือน
document.getElementById('filterButton').addEventListener('click', () => {
    const filterMonth = document.getElementById('filterMonth').value;
    if (filterMonth) fetchTransactionsByMonth(filterMonth);
});

// เรียกใช้งานครั้งแรก
fetchTransactions();

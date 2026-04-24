const DB = { flights: "sky_flights", cargo: "sky_cargo", alerts: "sky_alerts" };
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
function get(k, f = []) {
  return JSON.parse(localStorage.getItem(k) || JSON.stringify(f));
}
function set(k, v) {
  localStorage.setItem(k, JSON.stringify(v));
}
function id(p) {
  return p + "-" + Math.floor(1000 + Math.random() * 8999);
}
function toast(t, m) {
  let e =
    $(".toast") ||
    document.body.appendChild(
      Object.assign(document.createElement("div"), { className: "toast" }),
    );
  e.innerHTML = `<b>${t}</b><p style="margin-top:4px">${m}</p>`;
  e.classList.add("show");
  setTimeout(() => e.classList.remove("show"), 3200);
}
function seed() {
  if (!localStorage.getItem(DB.flights)) {
    set(DB.flights, [
      {
        id: "AI-101",
        origin: "BOM",
        dest: "LHR",
        time: "09:45",
        aircraft: "Boeing 777-300ER",
        type: "Passenger + Cargo",
        cargo: 8420,
        priority: "Standard",
        status: "On Time",
        risk: 12,
      },
      {
        id: "AI-204",
        origin: "DEL",
        dest: "JFK",
        time: "11:20",
        aircraft: "Airbus A350-900",
        type: "Passenger + Cargo",
        cargo: 12900,
        priority: "High Priority",
        status: "Boarding",
        risk: 36,
      },
      {
        id: "AI-317",
        origin: "DXB",
        dest: "SYD",
        time: "13:05",
        aircraft: "Airbus A380-800",
        type: "Passenger + Cargo",
        cargo: 4200,
        priority: "Perishables",
        status: "Delayed",
        risk: 58,
      },
      {
        id: "CI-088",
        origin: "BLR",
        dest: "SIN",
        time: "14:30",
        aircraft: "Boeing 787-9 Freighter",
        type: "Full Freighter",
        cargo: 9500,
        priority: "Express",
        status: "Cargo Only",
        risk: 22,
      },
    ]);
  }
  if (!localStorage.getItem(DB.cargo)) {
    set(DB.cargo, [
      {
        id: "CG-1001",
        type: "General Freight",
        flight: "AI-101",
        weight: 2100,
        volume: 16,
        shipper: "AeroKart Logistics",
        hub: "LHR Cargo Terminal",
        risk: "Low",
      },
      {
        id: "CG-1002",
        type: "Perishables",
        flight: "AI-317",
        weight: 1200,
        volume: 8,
        shipper: "FreshMart Exports",
        hub: "SYD Cold Chain",
        risk: "Medium",
      },
    ]);
  }
}
function badge(s) {
  let c = s.includes("Delay")
    ? "bad"
    : s.includes("Board")
      ? "warn"
      : s.includes("Cargo")
        ? "cyan"
        : "ok";
  return `<span class="badge ${c}">${s}</span>`;
}
function updateStats() {
  let f = get(DB.flights),
    c = get(DB.cargo),
    kg =
      f.reduce((a, b) => a + (+b.cargo || 0), 0) +
      c.reduce((a, b) => a + (+b.weight || 0), 0);
  if ($("#stFlights")) $("#stFlights").textContent = f.length;
  if ($("#stCargo")) $("#stCargo").textContent = (kg / 1000).toFixed(1) + "T";
  if ($("#stRisk"))
    $("#stRisk").textContent =
      Math.round(f.reduce((a, b) => a + b.risk, 0) / Math.max(f.length, 1)) +
      "%";
  if ($("#stRoutes"))
    ($("#stRoutes").textContent,
      new Set(f.map((x) => x.origin + "-" + x.dest)).size);
}
function renderFlights() {
  let el = $("#flightTable");
  if (!el) return;
  let f = get(DB.flights);
  el.innerHTML = f
    .map(
      (x) =>
        `<tr><td><b>${x.id}</b></td><td>${x.origin} → ${x.dest}</td><td>${x.time}</td><td>${x.aircraft}</td><td>${x.cargo} kg</td><td>${badge(x.status)}</td><td><button class="btn ghost" onclick="deleteFlight('${x.id}')">Remove</button></td></tr>`,
    )
    .join("");
}
function deleteFlight(i) {
  set(
    DB.flights,
    get(DB.flights).filter((x) => x.id !== i),
  );
  renderFlights();
  updateStats();
  toast("Flight Removed", "Schedule table updated successfully.");
}
function scheduleFlight() {
  let f = get(DB.flights);
  let o = $("#origin").value,
    d = $("#dest").value,
    w = +$("#cargo").value || 0;
  if (o === d) {
    toast("Invalid Route", "Origin and destination cannot be same.");
    return;
  }
  let status = w > 12000 ? "Needs Load Check" : "On Time",
    risk = Math.min(92, Math.floor(w / 250) + Math.floor(Math.random() * 18));
  let flight = {
    id: id("AI"),
    origin: o,
    dest: d,
    time: $("#time").value || "09:30",
    aircraft: $("#aircraft").value,
    type: $("#type").value,
    cargo: w,
    priority: $("#priority").value,
    status,
    risk,
  };
  f.unshift(flight);
  set(DB.flights, f);
  renderFlights();
  updateStats();
  toast(
    "AI Flight Scheduled",
    `${flight.id} ${o}→${d} added with ${risk}% operational risk.`,
  );
}
function renderCargo() {
  let el = $("#cargoTable");
  if (!el) return;
  let c = get(DB.cargo);
  el.innerHTML = c
    .map(
      (x) =>
        `<tr><td><b>${x.id}</b></td><td>${x.type}</td><td>${x.flight}</td><td>${x.weight} kg</td><td>${x.volume} m³</td><td>${x.shipper}</td><td>${badge(x.risk === "Low" ? "Low Risk" : x.risk + " Risk")}</td><td><button class="btn ghost" onclick="deleteCargo('${x.id}')">Remove</button></td></tr>`,
    )
    .join("");
}
function addCargo() {
  let w = +$("#cWeight").value || 0,
    v = +$("#cVolume").value || 0,
    type = $("#cType").value;
  let risk =
    type === "Hazmat" || w > 6000 || v > 45
      ? "High"
      : type === "Perishables" || w > 3000
        ? "Medium"
        : "Low";
  let c = get(DB.cargo);
  c.unshift({
    id: id("CG"),
    type,
    flight: $("#cFlight").value,
    weight: w,
    volume: v,
    shipper: $("#shipper").value || "Unknown",
    hub: $("#hub").value,
    risk,
  });
  set(DB.cargo, c);
  renderCargo();
  updateStats();
  toast("Cargo Registered", `AI handling rule applied. Risk level: ${risk}.`);
}
function deleteCargo(i) {
  set(
    DB.cargo,
    get(DB.cargo).filter((x) => x.id !== i),
  );
  renderCargo();
  updateStats();
  toast("Cargo Removed", "Cargo manifest updated.");
}
function aiOptimize() {
  let f = get(DB.flights),
    out = $("#aiOutput");
  if (!out) return;
  let msgs = [];
  f.forEach((x) => {
    if (x.cargo > 12000)
      msgs.push([
        "⚠️",
        `${x.id}: Cargo overload risk. Shift ${Math.round((x.cargo - 10500) / 2)} kg to next available freighter.`,
      ]);
    if (x.risk > 50)
      msgs.push([
        "⛈️",
        `${x.id}: Delay probability high. Move departure 20 minutes earlier to avoid ATC congestion.`,
      ]);
    if (x.priority === "Perishables")
      msgs.push([
        "❄️",
        `${x.id}: Cold-chain cargo detected. Hold temperature validation required before loading.`,
      ]);
    if (x.status === "On Time" && x.cargo < 9000)
      msgs.push([
        "✅",
        `${x.id}: Efficient load detected. Route can accept ${9000 - x.cargo} kg additional cargo.`,
      ]);
  });
  if (!msgs.length)
    msgs.push(["🤖", "No major conflict found. Current schedule is stable."]);
  out.innerHTML = msgs
    .map(
      (m) =>
        `<div class="ai-item"><div class="ai-icon">${m[0]}</div><p>${m[1]}</p></div>`,
    )
    .join("");
  toast(
    "AI Optimization Complete",
    `${msgs.length} recommendation(s) generated.`,
  );
}
function fillFlightSelect() {
  let el = $("#cFlight");
  if (!el) return;
  el.innerHTML = get(DB.flights)
    .map((f) => `<option>${f.id} ${f.origin}→${f.dest}</option>`)
    .join("");
}
function renderReports() {
  let f = get(DB.flights),
    c = get(DB.cargo);
  if ($("#reportText")) {
    $("#reportText").innerHTML =
      `<b>Executive Summary</b><br>Total flights: ${f.length}. Total cargo manifests: ${c.length}. Average risk: ${Math.round(f.reduce((a, b) => a + b.risk, 0) / Math.max(1, f.length))}%. AI suggests prioritising high cargo loads, cold-chain checks, and delayed routes for improvement.`;
  }
  let tb = $("#riskTable");
  if (tb)
    tb.innerHTML = f
      .map(
        (x) =>
          `<tr><td>${x.id}</td><td>${x.origin}→${x.dest}</td><td>${x.risk}%</td><td><div class="meter"><div style="width:${x.risk}%"></div></div></td></tr>`,
      )
      .join("");
}
function downloadReport() {
  let data = {
    flights: get(DB.flights),
    cargo: get(DB.cargo),
    generated: new Date().toLocaleString(),
  };
  let blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    }),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "skylogic-ai-report.json";
  a.click();
  toast("Report Downloaded", "JSON project report exported.");
}
document.addEventListener("DOMContentLoaded", () => {
  seed();
  updateStats();
  renderFlights();
  fillFlightSelect();
  renderCargo();
  renderReports();
  if ($("#aiOutput")) aiOptimize();
});

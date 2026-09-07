(function () {
  var navBtn = document.querySelector("[data-toggle-nav]");
  var sidebar = document.getElementById("sidebar");
  var backdrop = document.querySelector("[data-close-nav]");
  function closeNav() {
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.hidden = true;
  }
  if (navBtn && sidebar) {
    navBtn.addEventListener("click", function () {
      sidebar.classList.toggle("open");
      if (backdrop) backdrop.hidden = !sidebar.classList.contains("open");
    });
  }
  if (backdrop) backdrop.addEventListener("click", closeNav);

  document.querySelectorAll("[data-show-password]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = document.getElementById(btn.getAttribute("data-show-password"));
      if (!input) return;
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
    });
  });

  document.querySelectorAll("[data-wizard]").forEach(function (root) {
    var panels = root.querySelectorAll(".wizard-panel");
    var buttons = root.querySelectorAll(".steps button");
    function go(i) {
      panels.forEach(function (p, idx) { p.hidden = idx !== i; });
      buttons.forEach(function (b, idx) { b.classList.toggle("on", idx === i); });
    }
    buttons.forEach(function (b, idx) {
      b.addEventListener("click", function () { go(idx); });
    });
    root.querySelectorAll("[data-next]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = Number(b.getAttribute("data-next"));
        go(i);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    go(0);
  });

  var district = document.getElementById("district_id");
  var llg = document.getElementById("llg_id");
  if (district && llg) {
    var endpoint = district.getAttribute("data-llg-url");
    function loadLlgs(id, selected) {
      if (!id) {
        llg.innerHTML = '<option value="">Select district first</option>';
        return;
      }
      fetch(endpoint + "?district_id=" + encodeURIComponent(id))
        .then(function (r) { return r.json(); })
        .then(function (rows) {
          llg.innerHTML = '<option value="">Select LLG</option>';
          rows.forEach(function (row) {
            var opt = document.createElement("option");
            opt.value = row.id;
            opt.textContent = row.name;
            if (selected && selected === row.id) opt.selected = true;
            llg.appendChild(opt);
          });
        });
    }
    district.addEventListener("change", function () { loadLlgs(district.value, ""); });
    if (district.value) loadLlgs(district.value, llg.getAttribute("data-selected") || "");
  }

  var inst = document.getElementById("institution_id");
  var prog = document.getElementById("program_name");
  if (inst && prog && window.HUEF_PROGRAMS) {
    inst.addEventListener("change", function () {
      var id = inst.value;
      var matches = window.HUEF_PROGRAMS.filter(function (p) { return p.institution_id === id; });
      if (matches.length && !prog.value) prog.value = matches[0].name;
    });
  }

  var dash = document.querySelector("[data-live-dashboard]");
  if (dash) {
    var url = dash.getAttribute("data-live-dashboard");
    function paint(data) {
      Object.keys(data.totals || {}).forEach(function (k) {
        var el = dash.querySelector('[data-kpi="' + k + '"]');
        if (el) el.textContent = data.totals[k];
      });
      var stamp = dash.querySelector("[data-generated]");
      if (stamp) stamp.textContent = data.generatedAt || "";
      var chart = dash.querySelector("[data-chart]");
      if (chart && data.submissionsByDay) {
        var max = Math.max.apply(null, data.submissionsByDay.map(function (d) { return d.count; }).concat([1]));
        chart.innerHTML = data.submissionsByDay.map(function (d) {
          var h = Math.round((d.count / max) * 100);
          return '<div class="chart-bar" style="height:' + h + '%" title="' + d.label + ': ' + d.count + '"><span>' + d.label + "</span></div>";
        }).join("");
      }
      var tbody = dash.querySelector("[data-queue]");
      if (tbody && data.attentionQueue) {
        tbody.innerHTML = data.attentionQueue.map(function (row) {
          return "<tr><td><a href=\"" + row.href + "\">" + row.name + "</a><div class=\"muted\">" + row.program + "</div></td><td>" + row.district + "</td><td>" + row.institution + "</td><td>" + row.statusLabel + "</td><td>" + row.submittedLabel + "</td></tr>";
        }).join("") || "<tr><td colspan=\"5\">No applications waiting.</td></tr>";
      }
    }
    function tick() {
      fetch(url, { headers: { Accept: "application/json" } })
        .then(function (r) { return r.json(); })
        .then(paint)
        .catch(function () {});
    }
    tick();
    setInterval(tick, 8000);
  }
})();

"use strict";
document.addEventListener("DOMContentLoaded", async () => {
  const dashboard = await initDashboard(tableau.extensions);
  const worksheetSelect = initWorksheetSelect(dashboard);
  const worksheet = findWorksheetByName(dashboard, worksheetSelect.value);
  if (!worksheet) {
    updateInfoDiv({ errorMsg: `Worksheet "${worksheet}" not found.` });
    return;
  }
  const filtersDiv = document.getElementById("filters");
  updateFilterDiv(filtersDiv, dashboard);
  worksheet.addEventListener(tableau.TableauEventType.FilterChanged, () =>
    updateFilterDiv(filtersDiv, dashboard),
  );
  const exportButton = document.getElementById("exportButton");
  exportButton.addEventListener("click", async () => {
    try {
      updateInfoDiv({ showLoading: true });
      const dashboardFilters = await dashboard.getFiltersAsync();
      const filteredData = await worksheet.getSummaryDataAsync();
      const excelData = createExcelData(dashboardFilters, filteredData);
      if (!excelData) {
        return updateInfoDiv({
          errorMsg:
            "No data to export for the selected worksheet with current filters.",
        });
      }
      const blob = await createExcelBlob(worksheet.name, ...excelData);
      downloadFile(
        `${worksheet.name}_filtered_data.xlsx`,
        blob,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      updateInfoDiv({ showLoading: false });
    } catch (error) {
      console.error("Error exporting data:", error);
      updateInfoDiv({ errorMsg: "An error occurred during export: " + error });
    }
  });
});
function createExcelData(dashboardFilters, filteredData) {
  const dataTable = parseDataTable(filteredData);
  if (!dataTable) return;
  const metaData = {
    headers: ["File Extraction Time:"],
    rows: [
      [
        "    " +
          new Date().toLocaleString(undefined, {
            dateStyle: "full",
            timeStyle: "long",
          }),
      ],
      [],
    ],
  };
  const filterSummaries = parseFilterSummaries(dashboardFilters);
  const filters = {
    headers: ["Results Filtered By:"],
    rows: filterSummaries.map(({ name, values }) => [
      `    ${name} → ${values.join(", ")}`,
    ]),
  };
  return [metaData, filters, { ...dataTable, type: "asExcelTable" }];
}
async function createExcelBlob(sheetName, ...tables) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName, {
    properties: { defaultColWidth: 40 },
  });
  tables.forEach((table) => {
    if (table.type === "asExcelTable") {
      const headerRow = worksheet.addRow(table.headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "9C6500" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEB9C" },
        };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    } else {
      const headerRow = worksheet.addRow(table.headers);
      headerRow.font = { bold: true };
    }
    worksheet.addRows(table.rows);
    worksheet.addRow([""]);
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
async function initDashboard(extensions) {
  await extensions.initializeAsync();
  return extensions.dashboardContent?.dashboard;
}
function findDashboardWorksheet(dashboard) {
  const dashboardObj = dashboard.getDashboardObjectById(
    dashboard.activeDashboardObjectId,
  );
  return dashboardObj?.worksheet;
}
function findWorksheetByName(dashboard, sheetName) {
  return dashboard.worksheets.find((sheet) => sheet.name === sheetName);
}
function initWorksheetSelect(dashboard) {
  const worksheetSelect = document.getElementById("worksheetSelect");
  dashboard.worksheets.forEach((worksheet) => {
    const option = document.createElement("option");
    option.value = worksheet.name;
    option.innerText = worksheet.name;
    worksheetSelect.appendChild(option);
  });
  return worksheetSelect;
}
async function updateFilterDiv(filtersDiv, dashboard) {
  const filters = await dashboard.getFiltersAsync();
  const filterSummaries = parseFilterSummaries(filters);
  filtersDiv.innerHTML = filterSummaries
    .map(({ name, values }) => `${name} → ${values.join(", ")}`)
    .join("<br/>");
  return filtersDiv;
}
function parseFilterSummaries(filters) {
  const summaries = filters
    .map((filter) => ({
      name: filter.fieldName,
      values: parseFilterValues(filter),
    }))
    .sort(({ name: a }, { name: b }) => a.localeCompare(b));
  return summaries;
}
function parseFilterValues(filter) {
  if ("isAllSelected" in filter && filter.isAllSelected) {
    return ["All"];
  }
  if (isCategoricalFilter(filter)) {
    return filter.appliedValues
      .map((val) => val.formattedValue || val.value)
      .sort((a, b) => a.localeCompare(b));
  }
  if (isRangeFilter(filter)) {
    let value = "";
    value += filter.minValue ? filter.minValue.formattedValue : "";
    value += filter.minValue && filter.maxValue ? ` ⇔ ` : "";
    value += filter.maxValue ? filter.maxValue.formattedValue : "";
    return [value];
  }
  if (isRelativeDateFilter(filter)) {
    return [
      "Period: " + filter.periodType,
      "RangeN: " + filter.rangeN,
      "Range Type: " + filter.rangeType,
    ];
  }
  return [];
}
function parseDataTable(dataTable) {
  if (!dataTable || dataTable.data.length === 0) {
    return undefined;
  }
  const headers = dataTable.columns.map((col) => col.fieldName);
  const rows = dataTable.data.map((row) =>
    row.map((cell) => (cell.value === null ? "" : cell.value)),
  );
  return { headers, rows };
}
function isCategoricalFilter(filter) {
  return filter.filterType === "categorical";
}
function isRangeFilter(filter) {
  return filter.filterType === "range";
}
function isHierarchicalFilter(filter) {
  return filter.filterType === "hierarchical";
}
function isRelativeDateFilter(filter) {
  return filter.filterType === "relative-date";
}
function updateInfoDiv(config) {
  const errorDiv = document.getElementById("error");
  errorDiv.innerText = "errorMsg" in config ? config.errorMsg : "";
  const loadingDiv = document.getElementById("loading");
  if ("showLoading" in config && config.showLoading) {
    loadingDiv.style.display = "block";
  } else {
    loadingDiv.style.display = "none";
  }
}
function downloadFile(name, data, type) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

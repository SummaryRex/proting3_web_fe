import { useEffect, useState } from "react";
import DashboardLayout from "../components/layouts/DashboardLayout";
import DataTable from "../components/ui/DataTable";
import SearchInput from "../components/ui/SearchInput";
import StatusBadge from "../components/ui/StatusBadge";
import DamageDetailModal from "../components/modals/DamageDetailModal";

import {
  getReports,
  getReportById,
  approveReport,
  rejectReport,
} from "../services/reportService";

const tableColumns = [
  { label: "REPORT ID" },
  { label: "EQUIPMENT NAME" },
  { label: "OPERATOR NAME" },
  { label: "REPORT DATE" },
  { label: "STATUS" },
  { label: "ACTIONS" },
];

export default function DamageReport() {
  const [activeFilter, setActiveFilter] = useState("Pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [reports, setReports] = useState([]);
  const [modalData, setModalData] = useState(null);

  // ────────────────
  // FETCH LIST DATA
  // ────────────────
  const fetchReports = async () => {
    try {
      const data = await getReports({
        status: activeFilter.toLowerCase(),
        search: searchQuery,
      });

      setReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeFilter]);

  // ────────────────
  // DETAIL MODAL
  // ────────────────
  const openDetail = async (id) => {
    try {
      const data = await getReportById(id);
      setModalData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const closeDetail = () => setModalData(null);

  // ────────────────
  // APPROVE
  // ────────────────
  const handleApprove = async (id) => {
    try {
      await approveReport(id);
      fetchReports(); // refresh table
    } catch (err) {
      console.error(err);
    }
  };

  // ────────────────
  // REJECT
  // ────────────────
  const handleReject = async (id) => {
    try {
      await rejectReport(id);
      fetchReports(); // refresh table
    } catch (err) {
      console.error(err);
    }
  };

  // ────────────────
  // SEARCH HANDLER
  // ────────────────
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchReports();
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  return (
    <DashboardLayout title="Damage Reports">
      {/* FILTER + SEARCH */}
      <section className="flex items-center justify-between gap-4 mb-5 panel px-5 py-4">
        <SearchInput
          placeholder="Search reports..."
          value={searchQuery}
          onChange={handleSearch}
          className="flex-[0_1_400px]"
        />

        <div className="flex items-center gap-2">
          <span className="text-[0.8rem] text-djati-muted font-medium mr-1">
            Status:
          </span>

          {["Pending", "Approved", "Rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-lg px-4 py-2 text-[0.78rem] font-semibold transition-all duration-200 ${
                activeFilter === f
                  ? "bg-status-pending-bg border border-djati-amber text-djati-amber"
                  : "bg-transparent border border-djati-border-light text-[#d4d4d4] hover:border-djati-amber hover:text-djati-amber"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* TABLE */}
      <section>
        <DataTable
          columns={tableColumns}
          data={reports}
          className="!rounded-b-none !border-b-0"
          renderRow={(r) => (
            <tr key={r.id} className="table-row-hover">

              <td className="px-4 py-3.5 text-[0.82rem]">{r.id}</td>
              <td className="px-4 py-3.5 text-[0.82rem]">{r.equipment_name}</td>
              <td className="px-4 py-3.5 text-[0.82rem]">{r.operator_name}</td>
              <td className="px-4 py-3.5 text-[0.82rem]">{r.report_date}</td>

              <td className="px-4 py-3.5">
                <StatusBadge variant={r.status}>
                  {r.status}
                </StatusBadge>
              </td>

              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1.5">

                  {/* VIEW */}
                  <button
                    onClick={() => openDetail(r.id)}
                    className="btn-ghost px-3 py-1.5 text-[0.72rem] font-semibold !rounded-md"
                  >
                    View Detail
                  </button>

                  {/* APPROVE */}
                  <button
                    onClick={() => handleApprove(r.id)}
                    className="btn-success-outline px-3 py-1.5 text-[0.72rem] font-semibold !rounded-md"
                  >
                    Approve
                  </button>

                  {/* REJECT */}
                  <button
                    onClick={() => handleReject(r.id)}
                    className="btn-danger-outline px-3 py-1.5 text-[0.72rem] font-semibold !rounded-md"
                  >
                    Reject
                  </button>

                </div>
              </td>
            </tr>
          )}
        />
      </section>

      {/* MODAL */}
      <DamageDetailModal data={modalData} onClose={closeDetail} />
    </DashboardLayout>
  );
}
import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";

/**
 * Medical Prescription Generator
 * - React + Tailwind UI
 * - ReactQuill WYSIWYG editor
 * - LocalStorage: templates, signatures, logo
 * - A4-optimized print
 *
 * წინასწარ განსაზღვრული ექიმების სიით ქართულად
 */

// LOCALSTORAGE KEYS
const LS_KEYS = {
  TEMPLATES: "mpg_templates_v1",
  SIGS: "mpg_signatures_v1",
  LOGO: "mpg_logo_v1"
};

// Clinic name
const CLINIC_FULL_NAME =
  "თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი და ინგოროყვას მაღალი სამედიცინო ტექნოლოგიების საუნივერსიტეტო კლინიკა";

// Predefined doctors (requested list in Georgian)
const DOCTORS = [
  "ნინო კიკვაძე",
  "ანა დალაქიშვილი",
  "ეკლა მაისურაძე",
  "ურად მიგინეიშვილი",
  "კეთევან ზედელაშვილი",
  "ტერეზა ოსადჩუკე",
  "ეკატერინე მიქელაძე"
];

export default function PrescriptionApp() {
  const [patientName, setPatientName] = useState("");
  const [historyNumber, setHistoryNumber] = useState("");
  const [issueDate, setIssueDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [prescription, setPrescription] = useState(
    `<p><strong>დანიშნულება:</strong></p><p></p>`
  );
  const [templates, setTemplates] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTORS[0]);
  const [signatures, setSignatures] = useState({});
  const [logo, setLogo] = useState(null);
  const quillRef = useRef(null);

  // load from localStorage on mount
  useEffect(() => {
    try {
      const t = localStorage.getItem(LS_KEYS.TEMPLATES);
      if (t) setTemplates(JSON.parse(t));
      const s = localStorage.getItem(LS_KEYS.SIGS);
      if (s) setSignatures(JSON.parse(s));
      const l = localStorage.getItem(LS_KEYS.LOGO);
      if (l) setLogo(l);
    } catch (e) {
      console.error("Failed to load localStorage:", e);
    }
  }, []);

  // persist templates & signatures & logo
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.TEMPLATES, JSON.stringify(templates));
    } catch (e) {}
  }, [templates]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.SIGS, JSON.stringify(signatures));
    } catch (e) {}
  }, [signatures]);

  useEffect(() => {
    try {
      if (logo) localStorage.setItem(LS_KEYS.LOGO, logo);
      else localStorage.removeItem(LS_KEYS.LOGO);
    } catch (e) {}
  }, [logo]);

  // Quill toolbar config
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"]
    ]
  };
  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "align",
    "link",
    "image"
  ];

  // Handlers
  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  }

  function handleSignatureUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setSignatures((prev) => ({ ...prev, [selectedDoctor]: reader.result }));
    reader.readAsDataURL(file);
  }

  function saveTemplate(name) {
    if (!name || !name.trim()) {
      alert("შეიყვანეთ შაბლონის დასახელება.");
      return;
    }
    const exists = templates.find((t) => t.name === name);
    const payload = { name, content: prescription, updatedAt: new Date().toISOString() };
    if (exists) {
      if (!confirm("შაბლონი იმავე სახელით უკვე არსებობს — ჩაანაცვლოთ?")) return;
      setTemplates((prev) => prev.map((t) => (t.name === name ? payload : t)));
    } else {
      setTemplates((prev) => [...prev, payload]);
    }
    // clear name input
    const el = document.getElementById("tmplName");
    if (el) el.value = "";
  }

  function deleteTemplate(name) {
    if (!confirm(`გინდა მართლა წაიშალოს შაბლონი: ${name}?`)) return;
    setTemplates((prev) => prev.filter((t) => t.name !== name));
  }

  function applyTemplate(name, mode = "replace") {
    const t = templates.find((x) => x.name === name);
    if (!t) return;
    if (mode === "replace") setPrescription(t.content);
    else setPrescription((prev) => prev + t.content);
  }

  function handlePrint() {
    // Open print dialog. CSS sets A4 and hides .no-print
    window.print();
  }

  // small helper to export templates as JSON (optional)
  function exportTemplates() {
    const data = JSON.stringify(templates, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mpg_templates.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-80 bg-white p-4 rounded-lg shadow-sm no-print">
        <h3 className="text-lg font-semibold mb-3">შაბლონები</h3>

        <div className="space-y-2 max-h-56 overflow-auto mb-3">
          {templates.length === 0 && (
            <div className="text-sm text-gray-500">შენახული შაბლონები არ არის</div>
          )}
          {templates.map((t) => (
            <div
              key={t.name}
              className="flex items-center justify-between gap-2 border p-2 rounded"
            >
              <div className="truncate">{t.name}</div>
              <div className="flex gap-1">
                <button
                  className="text-xs px-2 py-1 bg-blue-50 rounded"
                  onClick={() => applyTemplate(t.name, "replace")}
                >
                  ჩასმა
                </button>
                <button
                  className="text-xs px-2 py-1 bg-green-50 rounded"
                  onClick={() => applyTemplate(t.name, "append")}
                >
                  დამატება
                </button>
                <button
                  className="text-xs px-2 py-1 bg-red-50 rounded"
                  onClick={() => deleteTemplate(t.name)}
                >
                  წაშლა
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">შინახვა ახალ შაბლონად</label>
          <div className="flex gap-2">
            <input
              id="tmplName"
              className="flex-1 p-2 border rounded"
              placeholder="შეიყვანეთ სახელი"
            />
            <button
              className="px-3 py-2 bg-indigo-600 text-white rounded"
              onClick={() => {
                const el = document.getElementById("tmplName");
                saveTemplate(el?.value?.trim());
              }}
            >
              შენახვა
            </button>
          </div>
        </div>

        <hr className="my-3" />

        <div className="mb-3">
          <h4 className="font-medium">ლოგო</h4>
          <input type="file" accept="image/*" onChange={handleLogoUpload} className="mt-2" />
          {logo && (
            <img src={logo} alt="logo" className="mt-3 max-h-20 object-contain border p-1 rounded" />
          )}
          {logo && (
            <div className="mt-2 text-xs">
              <button
                className="text-xs px-2 py-1 bg-gray-100 rounded"
                onClick={() => {
                  if (!confirm("გსურთ ლოგოს წაშლა?")) return;
                  setLogo(null);
                }}
              >
                ლოგოს წაშლა
              </button>
            </div>
          )}
        </div>

        <hr className="my-3" />

        <div>
          <h4 className="font-medium">ექიმი & ხელმოწერა</h4>
          <div className="mt-2">
            <label className="block text-sm mb-1">აირჩიეთ ექიმი</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {DOCTORS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2">
            <input type="file" accept="image/*" onChange={handleSignatureUpload} />
            <div className="mt-2 text-sm text-gray-600">
              ატვირთეთ ციფრული ხელმოწერა — შეინახება ბრაუზერში (LocalStorage).
            </div>
            {signatures[selectedDoctor] && (
              <img
                src={signatures[selectedDoctor]}
                alt="sig"
                className="mt-3 max-h-20 object-contain border p-1 rounded"
              />
            )}
          </div>
        </div>

        <hr className="my-3" />

        <div className="flex gap-2">
          <button
            className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm"
            onClick={() => {
              if (!confirm("შეგნებულად გსურთ ყველა მონაცემის (შაბლონები/ხელმოწერები/ლოგო) წაშლა?"))
                return;
              localStorage.removeItem(LS_KEYS.TEMPLATES);
              localStorage.removeItem(LS_KEYS.SIGS);
              localStorage.removeItem(LS_KEYS.LOGO);
              setTemplates([]);
              setSignatures({});
              setLogo(null);
            }}
          >
            ყველა მონაცემის წაშლა
          </button>
          <button
            className="px-3 py-2 bg-gray-200 rounded text-sm"
            onClick={() => exportTemplates()}
          >
            ექსპორტი (.json)
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1">
        <div className="flex items-center justify-between mb-4 no-print">
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={handlePrint}
            >
              ბეჭდვა
            </button>
            <button
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() => {
                // save as PDF via print dialog
                handlePrint();
              }}
            >
              შენახვა PDF
            </button>
          </div>
          <div className="text-sm text-gray-600">A4 ოპტიმიზირებული — Header/Footer არ ჩანს ბეჭდვაზე</div>
        </div>

        <div className="prescription-sheet max-w-3xl mx-auto bg-white p-6 rounded shadow-sm">
          {/* Header */}
          <div className="flex flex-col items-center mb-4">
            {logo ? (
              <img src={logo} alt="clinic logo" className="max-h-20 object-contain mb-2" />
            ) : (
              <div className="h-16 w-full flex items-center justify-center text-gray-300 mb-2">ლოგო</div>
            )}
            <div className="text-center">
              <div className="text-lg font-semibold">{CLINIC_FULL_NAME}</div>
            </div>
          </div>

          {/* Patient & meta */}
          <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
            <div>
              <label className="block text-xs text-gray-600">პაციენტი</label>
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="სახელი გვარი"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">ისტორიის №</label>
              <input
                value={historyNumber}
                onChange={(e) => setHistoryNumber(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="ისტ. №"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">თარღი</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">დანიშნულება</label>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={prescription}
              onChange={setPrescription}
              modules={modules}
              formats={formats}
            />
          </div>

          {/* Doctor + signature */}
          <div className="flex items-center justify-between mt-10">
            <div>
              <div className="text-sm text-gray-600">ექიმი</div>
              <div className="text-lg font-medium">{selectedDoctor}</div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-600">ხელმოწერა</div>
              <div className="mt-2">
                {signatures[selectedDoctor] ? (
                  <img src={signatures[selectedDoctor]} alt="signature" className="max-h-24 object-contain" />
                ) : (
                  <div className="text-xs text-gray-400">ხელმოწერა არ არის ატვირთული</div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">{selectedDoctor}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

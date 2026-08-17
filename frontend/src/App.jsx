import {
  useEffect,
  useState,
  useCallback,
  useRef
} from "react";

import "./App.css";

const API_URL = "http://localhost:500";

const OBJECTS = [
  "Account",
  "Opportunity",
  "Lead",
  "Contact",
  "Case"
];

/*
========================================================
FORM FIELDS
========================================================
These fields match the fields already exposed by your
working backend.
*/

const FORM_FIELDS = {
  Account: [
    {
      name: "Name",
      label: "Account Name",
      type: "text",
      required: true
    },
    {
      name: "Industry",
      label: "Industry",
      type: "text"
    },
    {
      name: "Phone",
      label: "Phone",
      type: "text"
    },
    {
      name: "Website",
      label: "Website",
      type: "text"
    },
    {
      name: "BillingCity",
      label: "Billing City",
      type: "text"
    }
  ],

  Opportunity: [
    {
      name: "Name",
      label: "Opportunity Name",
      type: "text",
      required: true
    },
    {
      name: "StageName",
      label: "Stage",
      type: "text"
    },
    {
      name: "Amount",
      label: "Amount",
      type: "number"
    },
    {
      name: "CloseDate",
      label: "Close Date",
      type: "date"
    },
    {
      name: "Probability",
      label: "Probability (%)",
      type: "number"
    }
  ],

  Lead: [
    {
      name: "FirstName",
      label: "First Name",
      type: "text"
    },
    {
      name: "LastName",
      label: "Last Name",
      type: "text",
      required: true
    },
    {
      name: "Company",
      label: "Company",
      type: "text",
      required: true
    },
    {
      name: "Status",
      label: "Status",
      type: "text"
    },
    {
      name: "Email",
      label: "Email",
      type: "email"
    },
    {
      name: "Phone",
      label: "Phone",
      type: "text"
    }
  ],

  Contact: [
    {
      name: "FirstName",
      label: "First Name",
      type: "text"
    },
    {
      name: "LastName",
      label: "Last Name",
      type: "text",
      required: true
    },
    {
      name: "Email",
      label: "Email",
      type: "email"
    },
    {
      name: "Phone",
      label: "Phone",
      type: "text"
    },
    {
      name: "Title",
      label: "Title",
      type: "text"
    }
  ],

  Case: [
    {
      name: "Subject",
      label: "Subject",
      type: "text",
      required: true
    },
    {
      name: "Status",
      label: "Status",
      type: "text"
    },
    {
      name: "Priority",
      label: "Priority",
      type: "text"
    },
    {
      name: "Origin",
      label: "Origin",
      type: "text"
    },
    {
      name: "Description",
      label: "Description",
      type: "textarea"
    }
  ]
};

/*
========================================================
CREATE EMPTY FORM
========================================================
*/

const createEmptyForm = (objectName) => {
  const empty = {};

  FORM_FIELDS[objectName].forEach((field) => {
    empty[field.name] = "";
  });

  return empty;
};

/*
========================================================
APP
========================================================
*/

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  const [checkingLogin, setCheckingLogin] = useState(true);

  const [object, setObject] = useState("Account");

  const [records, setRecords] = useState([]);

  const [offset, setOffset] = useState(0);

  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(
    createEmptyForm("Account")
  );

  const [editingId, setEditingId] = useState(null);

  const [viewingRecord, setViewingRecord] =
    useState(null);

  const [message, setMessage] = useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const loaderRef = useRef(null);

  /*
  ======================================================
  CHECK LOGIN
  ======================================================
  */

  useEffect(() => {
    fetch(`${API_URL}/api/status`, {
      credentials: "include"
    })
      .then((response) => response.json())
      .then((data) => {
        setLoggedIn(data.loggedIn);
        setCheckingLogin(false);
      })
      .catch((error) => {
        console.error(
          "Login status error:",
          error
        );

        setCheckingLogin(false);
        setLoggedIn(false);
      });
  }, []);

  /*
  ======================================================
  LOAD RECORDS
  ======================================================
  */

  const loadRecords = useCallback(
    async (reset = false) => {
      if (!loggedIn) return;

      if (!reset && loadingMore) return;

      const currentOffset = reset ? 0 : offset;

      try {
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await fetch(
          `${API_URL}/api/${object}?offset=${currentOffset}`,
          {
            credentials: "include"
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load records"
          );
        }

        setRecords((previous) =>
          reset
            ? data
            : [...previous, ...data]
        );

        setHasMore(data.length === 20);

        setOffset(currentOffset + data.length);
      } catch (error) {
        console.error(
          "Load records error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to load records."
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      object,
      offset,
      loggedIn,
      loadingMore
    ]
  );

  /*
  ======================================================
  OBJECT CHANGE
  ======================================================
  */

  useEffect(() => {
    setRecords([]);
    setOffset(0);
    setHasMore(true);

    setEditingId(null);
    setViewingRecord(null);
    setForm(createEmptyForm(object));

    if (loggedIn) {
      loadRecords(true);
    }
    // eslint-disable-next-line
  }, [object, loggedIn]);

  /*
  ======================================================
  INFINITE PAGINATION
  ======================================================
  */

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loading &&
          !loadingMore
        ) {
          loadRecords(false);
        }
      },
      {
        rootMargin: "200px"
      }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [
    loadRecords,
    hasMore,
    loading,
    loadingMore
  ]);

  /*
  ======================================================
  FORM CHANGE
  ======================================================
  */

  const handleFormChange = (event) => {
    const {
      name,
      value
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  /*
  ======================================================
  RESET FORM
  ======================================================
  */

  const resetForm = () => {
    setForm(createEmptyForm(object));
    setEditingId(null);
  };

  /*
  ======================================================
  CREATE
  ======================================================
  */

  const handleCreate = async (event) => {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");
    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/${object}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify(form)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create record."
        );
      }

      setMessage(
        `${object} created successfully.`
      );

      resetForm();

      /*
      Reload from beginning so the newly created
      Salesforce record appears in the list.
      */

      setRecords([]);
      setOffset(0);
      setHasMore(true);

      await loadRecords(true);
    } catch (error) {
      console.error(
        "Create error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to create record."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  ======================================================
  START EDIT
  ======================================================
  */

  const startEdit = (record) => {
    const newForm = createEmptyForm(object);

    FORM_FIELDS[object].forEach(
      (field) => {
        newForm[field.name] =
          record[field.name] ?? "";
      }
    );

    setForm(newForm);
    setEditingId(record.Id);

    setMessage("");
    setErrorMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  /*
  ======================================================
  UPDATE
  ======================================================
  */

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingId) return;

    setMessage("");
    setErrorMessage("");
    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/${object}/${editingId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify(form)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update record."
        );
      }

      setMessage(
        `${object} updated successfully.`
      );

      resetForm();

      setRecords([]);
      setOffset(0);
      setHasMore(true);

      await loadRecords(true);
    } catch (error) {
      console.error(
        "Update error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to update record."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  ======================================================
  DELETE
  ======================================================
  */

  const handleDelete = async (id) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete this ${object}?`
      );

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/${object}/${id}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete record."
        );
      }

      setRecords((previous) =>
        previous.filter(
          (record) =>
            record.Id !== id
        )
      );

      setMessage(
        `${object} deleted successfully.`
      );
    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to delete record."
      );
    }
  };

  /*
  ======================================================
  VIEW
  ======================================================
  */

  const viewRecord = (record) => {
    setViewingRecord(record);
  };

  /*
  ======================================================
  LOGOUT
  ======================================================
  */

  const logout = async () => {
    try {
      await fetch(
        `${API_URL}/auth/logout`,
        {
          method: "POST",
          credentials: "include"
        }
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }

    setLoggedIn(false);
    setRecords([]);
    setViewingRecord(null);
    resetForm();
  };

  /*
  ======================================================
  FORMAT VALUE
  ======================================================
  */

  const formatValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    return String(value);
  };

  /*
  ======================================================
  LOGIN CHECK SCREEN
  ======================================================
  */

  if (checkingLogin) {
    return (
      <div className="app-shell">
        <div className="login-page">
          <div className="login-card">
            <div className="salesforce-logo">
              ☁
            </div>

            <h1>
              CloudVandana CRUD
            </h1>

            <p>
              Checking your Salesforce
              connection...
            </p>

            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  /*
  ======================================================
  LOGIN PAGE
  ======================================================
  */

  if (!loggedIn) {
    return (
      <div className="app-shell">
        <div className="login-page">
          <div className="login-card">

            <div className="salesforce-logo">
              ☁
            </div>

            <div className="login-badge">
              Salesforce CRUD
            </div>

            <h1>
              Welcome to
              <br />
              CloudVandana
            </h1>

            <p className="login-description">
              Manage your Salesforce
              records from one simple
              and friendly dashboard.
            </p>

            <button
              className="salesforce-login-btn"
              onClick={() =>
                (window.location.href =
                  `${API_URL}/auth/login`)
              }
            >
              <span className="cloud-icon">
                ☁
              </span>

              Login with Salesforce
            </button>

            <p className="secure-text">
              🔒 Secure Salesforce
              authentication
            </p>

          </div>
        </div>
      </div>
    );
  }

  /*
  ======================================================
  MAIN APPLICATION
  ======================================================
  */

  return (
    <div className="app-shell">

      {/* HEADER */}

      <header className="top-header">

        <div className="brand-section">

          <div className="brand-logo">
            ☁
          </div>

          <div>
            <h2>
              CloudVandana
            </h2>

            <span>
              Salesforce CRUD
              Dashboard
            </span>
          </div>

        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>

      </header>

      {/* MAIN */}

      <main className="main-content">

        {/* PAGE INTRO */}

        <section className="page-intro">

          <div>
            <span className="eyebrow">
              SALESFORCE DATA
            </span>

            <h1>
              Manage your records
            </h1>

            <p>
              Create, view, edit and
              delete Salesforce
              records easily.
            </p>
          </div>

          <div className="record-count-card">
            <span>
              Loaded records
            </span>

            <strong>
              {records.length}
            </strong>
          </div>

        </section>

        {/* OBJECT SELECTOR */}

        <section className="control-card">

          <div className="control-left">

            <label htmlFor="object-select">
              Salesforce Object
            </label>

            <select
              id="object-select"
              value={object}
              onChange={(event) =>
                setObject(
                  event.target.value
                )
              }
            >
              {OBJECTS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>

          </div>

          <div className="object-description">

            <strong>
              {object}
            </strong>

            <span>
              Manage {object.toLowerCase()}{" "}
              records
            </span>

          </div>

        </section>

        {/* ALERTS */}

        {message && (
          <div className="alert success-alert">
            <span>✓</span>
            {message}

            <button
              onClick={() =>
                setMessage("")
              }
            >
              ×
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="alert error-alert">
            <span>!</span>
            {errorMessage}

            <button
              onClick={() =>
                setErrorMessage("")
              }
            >
              ×
            </button>
          </div>
        )}

        {/* CREATE / EDIT CARD */}

        <section className="form-card">

          <div className="section-heading">

            <div className="section-icon">
              {editingId
                ? "✎"
                : "+"}
            </div>

            <div>
              <h2>
                {editingId
                  ? `Edit ${object}`
                  : `Create ${object}`}
              </h2>

              <p>
                {editingId
                  ? "Update the selected Salesforce record."
                  : "Enter the details to create a new Salesforce record."}
              </p>
            </div>

          </div>

          <form
            onSubmit={
              editingId
                ? handleUpdate
                : handleCreate
            }
            className="record-form"
          >

            <div className="form-grid">

              {FORM_FIELDS[
                object
              ].map((field) => (

                <div
                  className={
                    field.type ===
                    "textarea"
                      ? "form-group full-width"
                      : "form-group"
                  }
                  key={field.name}
                >

                  <label
                    htmlFor={field.name}
                  >
                    {field.label}

                    {field.required && (
                      <span className="required">
                        *
                      </span>
                    )}
                  </label>

                  {field.type ===
                  "textarea" ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      value={
                        form[
                          field.name
                        ] || ""
                      }
                      onChange={
                        handleFormChange
                      }
                      required={
                        field.required
                      }
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      rows="4"
                    />
                  ) : (
                    <input
                      id={field.name}
                      type={field.type}
                      name={field.name}
                      value={
                        form[
                          field.name
                        ] || ""
                      }
                      onChange={
                        handleFormChange
                      }
                      required={
                        field.required
                      }
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}

                </div>

              ))}

            </div>

            <div className="form-actions">

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Record"
                  : "Create Record"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}

            </div>

          </form>

        </section>

        {/* RECORDS CARD */}

        <section className="records-card">

          <div className="records-header">

            <div>

              <h2>
                {object} Records
              </h2>

              <p>
                Showing Salesforce{" "}
                {object.toLowerCase()}{" "}
                data
              </p>

            </div>

            <span className="records-pill">
              {records.length} loaded
            </span>

          </div>

          {/* LOADING */}

          {loading ? (
            <div className="loading-state">

              <div className="spinner"></div>

              <p>
                Loading {object} records...
              </p>

            </div>
          ) : records.length === 0 ? (
            <div className="empty-state">

              <div className="empty-icon">
                📂
              </div>

              <h3>
                No {object} records
              </h3>

              <p>
                Create your first{" "}
                {object.toLowerCase()}{" "}
                record using the form
                above.
              </p>

            </div>
          ) : (

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    {FORM_FIELDS[
                      object
                    ].map(
                      (field) => (
                        <th
                          key={field.name}
                        >
                          {field.label}
                        </th>
                      )
                    )}

                    <th className="action-header">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {records.map(
                    (record) => (

                      <tr
                        key={record.Id}
                      >

                        {FORM_FIELDS[
                          object
                        ].map(
                          (field) => (

                            <td
                              key={
                                field.name
                              }
                              title={formatValue(
                                record[
                                  field.name
                                ]
                              )}
                            >
                              {formatValue(
                                record[
                                  field.name
                                ]
                              )}
                            </td>

                          )
                        )}

                        <td className="actions-cell">

                          <div className="action-buttons">

                            <button
                              className="view-button"
                              onClick={() =>
                                viewRecord(
                                  record
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              className="edit-button"
                              onClick={() =>
                                startEdit(
                                  record
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                handleDelete(
                                  record.Id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

          {/* PAGINATION */}

          <div
            ref={loaderRef}
            className="pagination-loader"
          >

            {loadingMore ? (
              <>
                <div className="small-spinner"></div>
                Loading more records...
              </>
            ) : hasMore ? (
              "Scroll down to load more records"
            ) : records.length > 0 ? (
              "✓ All records loaded"
            ) : (
              ""
            )}

          </div>

        </section>

      </main>

      {/* VIEW MODAL */}

      {viewingRecord && (

        <div
          className="modal-overlay"
          onClick={() =>
            setViewingRecord(null)
          }
        >

          <div
            className="view-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="modal-eyebrow">
                  SALESFORCE RECORD
                </span>

                <h2>
                  {object} Details
                </h2>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setViewingRecord(null)
                }
              >
                ×
              </button>

            </div>

            <div className="details-grid">

              <div className="detail-item full-width">

                <span className="detail-label">
                  Record ID
                </span>

                <span className="detail-value record-id">
                  {viewingRecord.Id}
                </span>

              </div>

              {FORM_FIELDS[
                object
              ].map((field) => (

                <div
                  className={
                    field.type ===
                    "textarea"
                      ? "detail-item full-width"
                      : "detail-item"
                  }
                  key={field.name}
                >

                  <span className="detail-label">
                    {field.label}
                  </span>

                  <span className="detail-value">
                    {formatValue(
                      viewingRecord[
                        field.name
                      ]
                    )}
                  </span>

                </div>

              ))}

            </div>

            <div className="modal-actions">

              <button
                className="edit-button large-button"
                onClick={() => {
                  startEdit(
                    viewingRecord
                  );

                  setViewingRecord(
                    null
                  );
                }}
              >
                Edit Record
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  setViewingRecord(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
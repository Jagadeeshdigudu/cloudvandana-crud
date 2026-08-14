import { useEffect, useState } from "react";
import "./App.css";

// ======================================================
// API
// ======================================================

const API_URL =
  "https://cloudvandana-crud-backend.onrender.com";


// ======================================================
// API FETCH HELPER
// IMPORTANT: credentials include session cookie
// ======================================================

const apiFetch = (url, options = {}) => {

  return fetch(url, {
    ...options,
    credentials: "include"
  });

};


// ======================================================
// FORM FIELDS
// ======================================================

const objectFields = {

  Account: [
    {
      name: "Name",
      label: "Account Name",
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
      name: "Industry",
      label: "Industry",
      type: "text"
    },
    {
      name: "Rating",
      label: "Rating",
      type: "text"
    }
  ],


  Opportunity: [
    {
      name: "Name",
      label: "Opportunity Name",
      type: "text"
    },
    {
      name: "Amount",
      label: "Amount",
      type: "number"
    },
    {
      name: "StageName",
      label: "Stage",
      type: "text"
    },
    {
      name: "CloseDate",
      label: "Close Date",
      type: "date"
    },
    {
      name: "Probability",
      label: "Probability",
      type: "number"
    },
    {
      name: "Type",
      label: "Type",
      type: "text"
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
      type: "text"
    },
    {
      name: "Company",
      label: "Company",
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
    },
    {
      name: "Status",
      label: "Status",
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
    },
    {
      name: "Department",
      label: "Department",
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
      type: "text"
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
      type: "text"
    }
  ]

};


// ======================================================
// TABLE FIELDS
// ======================================================

const tableFields = {

  Account: [
    {
      name: "Name",
      label: "Name"
    },
    {
      name: "Phone",
      label: "Phone"
    },
    {
      name: "Website",
      label: "Website"
    },
    {
      name: "Industry",
      label: "Industry"
    },
    {
      name: "Rating",
      label: "Rating"
    }
  ],


  Opportunity: [
    {
      name: "Name",
      label: "Name"
    },
    {
      name: "Amount",
      label: "Amount"
    },
    {
      name: "StageName",
      label: "Stage"
    },
    {
      name: "CloseDate",
      label: "Close Date"
    },
    {
      name: "Probability",
      label: "Probability"
    },
    {
      name: "Type",
      label: "Type"
    }
  ],


  Lead: [
    {
      name: "FirstName",
      label: "First Name"
    },
    {
      name: "LastName",
      label: "Last Name"
    },
    {
      name: "Company",
      label: "Company"
    },
    {
      name: "Email",
      label: "Email"
    },
    {
      name: "Phone",
      label: "Phone"
    },
    {
      name: "Status",
      label: "Status"
    }
  ],


  Contact: [
    {
      name: "FirstName",
      label: "First Name"
    },
    {
      name: "LastName",
      label: "Last Name"
    },
    {
      name: "Email",
      label: "Email"
    },
    {
      name: "Phone",
      label: "Phone"
    },
    {
      name: "Department",
      label: "Department"
    },
    {
      name: "Title",
      label: "Title"
    }
  ],


  Case: [
    {
      name: "CaseNumber",
      label: "Case Number"
    },
    {
      name: "Subject",
      label: "Subject"
    },
    {
      name: "Status",
      label: "Status"
    },
    {
      name: "Priority",
      label: "Priority"
    },
    {
      name: "Origin",
      label: "Origin"
    },
    {
      name: "Description",
      label: "Description"
    }
  ]

};


// ======================================================
// REQUIRED FIELDS
// ======================================================

const requiredFields = {

  Account: [
    "Name"
  ],

  Opportunity: [
    "Name",
    "CloseDate"
  ],

  Lead: [
    "LastName",
    "Company"
  ],

  Contact: [
    "LastName"
  ],

  Case: [
    "Subject"
  ]

};


// ======================================================
// APP
// ======================================================

function App() {

  const [loggedIn, setLoggedIn] =
    useState(false);

  const [records, setRecords] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [nextRecordsUrl, setNextRecordsUrl] =
    useState(null);

  const [selectedObject, setSelectedObject] =
    useState("Contact");

  const [form, setForm] =
    useState({});

  const [viewingRecord, setViewingRecord] =
    useState(null);

  const [editingId, setEditingId] =
    useState(null);


  // ======================================================
  // CREATE EMPTY FORM
  // ======================================================

  const createEmptyForm =
    (objectName) => {

      const emptyForm = {};

      objectFields[
        objectName
      ].forEach(
        (field) => {

          emptyForm[
            field.name
          ] = "";

        }
      );

      return emptyForm;

    };


  // ======================================================
  // CLEAR FORM
  // ======================================================

  const clearForm =
    (
      objectName = selectedObject
    ) => {

      setForm(
        createEmptyForm(
          objectName
        )
      );

      setEditingId(null);

    };


  // ======================================================
  // CHECK LOGIN
  // ======================================================

  const checkLogin =
    async () => {

      try {

        const response =
          await apiFetch(
            `${API_URL}/api/status`
          );


        const data =
          await response.json();


        setLoggedIn(
          data.loggedIn
        );


        if (
          data.loggedIn
        ) {

          fetchRecords(
            selectedObject
          );

        }

      } catch (error) {

        console.error(
          "Status error:",
          error
        );

      }

    };


  // ======================================================
  // LOGIN
  // ======================================================

  const login = () => {

    window.location.href =
      `${API_URL}/auth/login`;

  };


  // ======================================================
  // FETCH RECORDS
  // ======================================================

  const fetchRecords =
    async (
      objectName = selectedObject
    ) => {

      try {

        setLoading(true);

        setNextRecordsUrl(null);


        const response =
          await apiFetch(
            `${API_URL}/api/records?object=${objectName}`
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          console.error(
            data
          );


          alert(
            data.message ||
            `Failed to load ${objectName}`
          );


          setRecords([]);

          return;

        }


        setRecords(
          data.records || []
        );


        setNextRecordsUrl(
          data.nextRecordsUrl ||
          null
        );


      } catch (error) {

        console.error(
          "Fetch records error:",
          error
        );


        setRecords([]);

        setNextRecordsUrl(null);

      } finally {

        setLoading(false);

      }

    };


  // ======================================================
  // LOAD NEXT 20
  // ======================================================

  const loadMoreRecords =
    async () => {

      if (
        !nextRecordsUrl ||
        loadingMore
      ) {

        return;

      }


      try {

        setLoadingMore(true);


        const response =
          await apiFetch(

            `${API_URL}/api/records?object=${selectedObject}&nextUrl=${encodeURIComponent(
              nextRecordsUrl
            )}`

          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          console.error(
            "Load more error:",
            data
          );

          return;

        }


        setRecords(
          (previousRecords) => [

            ...previousRecords,

            ...(data.records || [])

          ]
        );


        setNextRecordsUrl(
          data.nextRecordsUrl ||
          null
        );


      } catch (error) {

        console.error(
          "Load more records error:",
          error
        );

      } finally {

        setLoadingMore(false);

      }

    };


  // ======================================================
  // OBJECT CHANGE
  // ======================================================

  const handleObjectChange =
    (e) => {

      const object =
        e.target.value;


      setSelectedObject(
        object
      );

      setRecords([]);

      setNextRecordsUrl(null);

      setEditingId(null);

      setForm(
        createEmptyForm(
          object
        )
      );


      fetchRecords(
        object
      );

    };


  // ======================================================
  // INPUT CHANGE
  // ======================================================

  const handleChange =
    (e) => {

      const {
        name,
        value
      } = e.target;


      setForm(
        (previousForm) => ({

          ...previousForm,

          [name]:
            value

        })
      );

    };


  // ======================================================
  // CREATE RECORD
  // ======================================================

  const addRecord =
    async (e) => {

      e.preventDefault();


      try {

        const response =
          await apiFetch(

            `${API_URL}/api/records`,

            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body:
                JSON.stringify({

                  object:
                    selectedObject,

                  record:
                    form

                })

            }

          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          alert(
            data.message ||
            "Failed to create record"
          );

          return;

        }


        alert(
          `${selectedObject} added successfully!`
        );


        clearForm();


        await fetchRecords(
          selectedObject
        );


      } catch (error) {

        console.error(
          "Create record error:",
          error
        );


        alert(
          "Something went wrong while creating the record."
        );

      }

    };


  // ======================================================
  // VIEW RECORD
  // ======================================================

  const viewRecord =
    (record) => {

      setViewingRecord(
        record
      );

    };


  // ======================================================
  // START EDIT
  // ======================================================

  const startEdit =
    (record) => {

      setEditingId(
        record.Id
      );


      const newForm = {};


      objectFields[
        selectedObject
      ].forEach(
        (field) => {

          newForm[
            field.name
          ] =
            record[
              field.name
            ] || "";

        }
      );


      setForm(
        newForm
      );


      window.scrollTo({

        top: 0,

        behavior:
          "smooth"

      });

    };


  // ======================================================
  // UPDATE RECORD
  // ======================================================

  const updateRecord =
    async (e) => {

      e.preventDefault();


      try {

        const response =
          await apiFetch(

            `${API_URL}/api/records/${selectedObject}/${editingId}`,

            {

              method:
                "PUT",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body:
                JSON.stringify({

                  record:
                    form

                })

            }

          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          alert(
            data.message ||
            "Failed to update record"
          );

          return;

        }


        alert(
          `${selectedObject} updated successfully!`
        );


        clearForm();


        await fetchRecords(
          selectedObject
        );


      } catch (error) {

        console.error(
          "Update record error:",
          error
        );


        alert(
          "Something went wrong while updating the record."
        );

      }

    };


  // ======================================================
  // DELETE RECORD
  // ======================================================

  const deleteRecord =
    async (id) => {

      const confirmDelete =
        window.confirm(

          `Are you sure you want to delete this ${selectedObject}?`

        );


      if (
        !confirmDelete
      ) {

        return;

      }


      try {

        const response =
          await apiFetch(

            `${API_URL}/api/records/${selectedObject}/${id}`,

            {

              method:
                "DELETE"

            }

          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          alert(
            data.message ||
            "Failed to delete record"
          );

          return;

        }


        alert(
          `${selectedObject} deleted successfully!`
        );


        await fetchRecords(
          selectedObject
        );


      } catch (error) {

        console.error(
          "Delete record error:",
          error
        );


        alert(
          "Something went wrong while deleting the record."
        );

      }

    };


  // ======================================================
  // INITIAL FORM
  // ======================================================

  useEffect(
    () => {

      setForm(
        createEmptyForm(
          selectedObject
        )
      );

    },
    [selectedObject]
  );


  // ======================================================
  // INITIAL LOGIN CHECK
  // ======================================================

  useEffect(
    () => {

      checkLogin();

    },
    []
  );


  // ======================================================
  // INFINITE SCROLL
  // ======================================================

  useEffect(
    () => {

      const handleScroll =
        () => {

          const reachedBottom =
            window.innerHeight +
            window.scrollY >=
            document.documentElement
              .scrollHeight -
            250;


          if (
            reachedBottom
          ) {

            loadMoreRecords();

          }

        };


      window.addEventListener(
        "scroll",
        handleScroll
      );


      return () => {

        window.removeEventListener(
          "scroll",
          handleScroll
        );

      };

    },
    [
      nextRecordsUrl,
      loadingMore,
      selectedObject
    ]
  );


  // ======================================================
  // UI
  // ======================================================

  return (

    <div className="app">

      <h1>
        CloudVandana CRUD
      </h1>


      {!loggedIn ? (

        // ==================================================
        // LOGIN
        // ==================================================

        <div className="login-section">

          <h2>
            Salesforce Login
          </h2>


          <p>
            Please login with Salesforce
            to continue.
          </p>


          <button
            onClick={login}
          >
            Login with Salesforce
          </button>

        </div>

      ) : (

        // ==================================================
        // MAIN PAGE
        // ==================================================

        <div className="contacts-section">

          <h2>
            Salesforce Data
          </h2>


          {/* OBJECT SELECTOR */}

          <div className="object-selector">

            <label
              htmlFor="salesforce-object"
            >
              Select Salesforce Object:
            </label>


            <select
              id="salesforce-object"
              value={selectedObject}
              onChange={
                handleObjectChange
              }
            >

              <option value="Account">
                Account
              </option>

              <option value="Opportunity">
                Opportunity
              </option>

              <option value="Lead">
                Lead
              </option>

              <option value="Contact">
                Contact
              </option>

              <option value="Case">
                Case
              </option>

            </select>

          </div>


          <h3>
            Salesforce {selectedObject}
          </h3>


          {/* CREATE / UPDATE FORM */}

          <form
            className="record-form"
            onSubmit={
              editingId
                ? updateRecord
                : addRecord
            }
          >

            {objectFields[
              selectedObject
            ].map(
              (field) => (

                <input
                  key={field.name}
                  type={field.type}
                  name={field.name}
                  placeholder={field.label}
                  value={
                    form[field.name] ||
                    ""
                  }
                  onChange={
                    handleChange
                  }
                  required={
                    requiredFields[
                      selectedObject
                    ]?.includes(
                      field.name
                    )
                  }
                />

              )
            )}


            <button
              type="submit"
            >

              {editingId
                ? "Update Record"
                : "Add Record"}

            </button>


            {editingId && (

              <button
                type="button"
                className="cancel-btn"
                onClick={() =>
                  clearForm()
                }
              >

                Cancel

              </button>

            )}

          </form>


          <hr />


          {/* RECORD TABLE */}

          {loading ? (

            <p className="status-message">

              Loading {selectedObject}
              records...

            </p>

          ) : records.length === 0 ? (

            <p className="status-message">

              No {selectedObject}
              records found.

            </p>

          ) : (

            <>

              <div
                className="table-wrapper"
              >

                <table>

                  <thead>

                    <tr>

                      {tableFields[
                        selectedObject
                      ].map(
                        (field) => (

                          <th
                            key={field.name}
                          >

                            {field.label}

                          </th>

                        )
                      )}


                      <th
                        className="action-column"
                      >
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {records.map(
                      (record) => (

                        <tr
                          key={record.Id}
                        >

                          {tableFields[
                            selectedObject
                          ].map(
                            (field) => (

                              <td
                                key={
                                  field.name
                                }
                                title={
                                  record[
                                    field.name
                                  ] || "-"
                                }
                              >

                                {
                                  record[
                                    field.name
                                  ] || "-"
                                }

                              </td>

                            )
                          )}


                          <td
                            className="action-column"
                          >

                            <div
                              className="action-buttons"
                            >

                              <button
                                type="button"
                                className="view-btn"
                                onClick={() =>
                                  viewRecord(
                                    record
                                  )
                                }
                              >

                                View

                              </button>


                              <button
                                type="button"
                                className="edit-btn"
                                onClick={() =>
                                  startEdit(
                                    record
                                  )
                                }
                              >

                                Edit

                              </button>


                              <button
                                type="button"
                                className="delete-btn"
                                onClick={() =>
                                  deleteRecord(
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


              {loadingMore && (

                <p
                  className="loading-more"
                >

                  Loading more records...

                </p>

              )}


              {!nextRecordsUrl &&
                records.length > 0 && (

                  <p
                    className="end-message"
                  >

                    All records loaded.

                  </p>

                )}

            </>

          )}

        </div>

      )}


      {/* ==================================================
          VIEW RECORD MODAL
      ================================================== */}

      {viewingRecord && (

        <div
          className="modal-overlay"
          onClick={() =>
            setViewingRecord(null)
          }
        >

          <div
            className="modal-content"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h2>
              View {selectedObject}
            </h2>


            {tableFields[
              selectedObject
            ].map(
              (field) => (

                <div
                  className="view-field"
                  key={field.name}
                >

                  <strong>
                    {field.label}:
                  </strong>


                  <span>
                    {
                      viewingRecord[
                        field.name
                      ] || "-"
                    }
                  </span>

                </div>

              )
            )}


            <button
              type="button"
              onClick={() =>
                setViewingRecord(null)
              }
            >

              Close

            </button>

          </div>

        </div>

      )}

    </div>

  );

}

export default App;
# Overview
**This Application is a birthday viewer. It is built exclusively for the Fowose family and should be used as a resource to stay reminded of family member's birthdays.**
## Roles
* **Admin:** Administrator of the platform who is responsible for adding, removing, and editing user's birthdays. ***Read/Write***
* **Viewer** Family members who can view who's birthdays are tracked. ***Read-Only***

## Data Object
* Person ```{name: string; birthday: DateTime | string; timeZone: string}```

## Primary Flows

### 1. Adding a Birthday

#### 1.1 Frontend Swimlane (React)

1. **User Action:** Authenticated Admin clicks **“+ Add”** on `/`
2. **UI Response:** Show `<AddBirthdayForm>` modal with empty input fields.
3. **User Input:** Admin fills in **First Name**, **Last Name**, **Birthdate**, **Time Zone**, **Trivia Question**, **Trivia Answer**, and clicks **“Save”**.
4. **Validation (frontend):**
   * If any field is empty or invalid (e.g. date format wrong) → display inline error, prevent submission.
5. **HTTP Request (frontend):**

   ```http
   POST /api/personal/createBirthday
   Content-Type: application/json

   {
     "firstName": "string",
     "lastName":  "string",
     "birthdate": "YYYY-MM-DD",
     "timeZone":  "America/New_York",
     "triviaQuestion": "string",
     "triviaAnswer":   "string"
   }
   ```

#### 1.2 Backend Swimlane (Azure Function + MongoDB)

6. **Request Handling:** Azure Function receives and parses JSON payload.
7. **Server-side Validation:**
   * Validate required fields and date format.
   * If invalid → return **400 Bad Request** with details `{ field: message }`.
8. **Persistence:**
   * Insert the document into MongoDB using the `Birthday` model.
9. **Response:**
   * On success → **201 Created** with JSON `{ "id": "<Mongo ObjectID>" }`.
   * On server/database error → **500 Internal Server Error** with generic error message.

#### 1.3 Frontend Swimlane (React)

10. **Success (201):**
    * Close `<AddBirthdayForm>` modal.
    * Use context or state hook (`useBirthdayContext`) to dispatch `ADD_BIRTHDAY` with the new Person object (including returned `id`).
    * Update the upcoming birthdays list in state and start countdown timer for the new entry.
11. **Error (400):**
    * Parse field errors from response, display inline.
    * Return user to step 3 to correct inputs.
12. **Error (5xx):**
    * Show a global toast or banner: “An unexpected error occurred. Please try again.”

---

### 2. View Upcoming Birthdays and Sorted Countdown Timers

### 3. Editing/Deleting Entries

### 4. Page Access + Auth: Post-MVP
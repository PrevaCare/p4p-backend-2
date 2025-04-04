# Laboratory API Documentation

## Table of Contents

- [Lab Management](#lab-management)
- [Lab Packages](#lab-packages)
- [Individual Tests](#individual-tests)
- [Lab Reports](#lab-reports)

## Lab Management

| Method   | Route               | Purpose                              |
| -------- | ------------------- | ------------------------------------ |
| `POST`   | `/admin/lab`        | Create a new lab                     |
| `PATCH`  | `/admin/lab/:labId` | Update an existing lab               |
| `GET`    | `/admin/labs`       | Get all labs                         |
| `POST`   | `/admin/lab-detail` | Get detailed info for a specific lab |
| `DELETE` | `/admin/lab/:labId` | Delete a lab                         |

### Request Details

#### Create Lab (`POST /admin/lab`)

- **Auth Required**: Yes
- **Body**: Lab details
- **File Upload**: Logo required
- **Description**: Creates a new laboratory with uploaded logo and details

#### Update Lab (`PATCH /admin/lab/:labId`)

- **Auth Required**: Yes
- **Params**: labId
- **Body**: Updated lab details
- **File Upload**: Logo (optional)
- **Description**: Updates an existing laboratory's information

#### Get All Labs (`GET /admin/labs`)

- **Auth Required**: Yes
- **Description**: Retrieves all laboratories in the system

#### Get Lab Details (`POST /admin/lab-detail`)

- **Auth Required**: Yes
- **Body**: Lab ID
- **Description**: Retrieves detailed information for a specific laboratory

#### Delete Lab (`DELETE /admin/lab/:labId`)

- **Auth Required**: Yes (Super admin only)
- **Params**: labId
- **Description**: Permanently removes a laboratory from the system

## Lab Packages

| Method   | Route                                  | Purpose                                 |
| -------- | -------------------------------------- | --------------------------------------- |
| `POST`   | `/admin/lab/package`                   | Create a new package                    |
| `PATCH`  | `/admin/lab/package/:packageId`        | Update a package                        |
| `POST`   | `/admin/lab/package/categories`        | Get unique package categories for a lab |
| `POST`   | `/admin/lab/package/packages`          | Get all tests in a category             |
| `POST`   | `/admin/lab/package-single`            | Get details for a specific package      |
| `PATCH`  | `/admin/lab/package/update/:packageId` | Update a package by ID                  |
| `DELETE` | `/admin/lab/package/delete/:packageId` | Delete a package                        |

### Request Details

#### Create Package (`POST /admin/lab/package`)

- **Auth Required**: Yes (Employee permission)
- **Body**: Package details (lab, category, testName)
- **Description**: Creates a new laboratory test package

#### Get Package Categories (`POST /admin/lab/package/categories`)

- **Auth Required**: Yes
- **Body**: Lab ID
- **Description**: Retrieves all unique categories of packages for a specific lab

#### Get Tests by Category (`POST /admin/lab/package/packages`)

- **Auth Required**: Yes
- **Body**: Lab ID and category
- **Description**: Gets all tests within a specific category for a lab

#### Get Package Details (`POST /admin/lab/package-single`)

- **Auth Required**: Yes
- **Body**: Package ID
- **Description**: Retrieves complete details of a specific lab package

#### Delete Package (`DELETE /admin/lab/package/delete/:packageId`)

- **Auth Required**: Yes
- **Params**: packageId
- **Description**: Removes a lab package from the system

## Individual Tests

| Method | Route                        | Purpose                       |
| ------ | ---------------------------- | ----------------------------- |
| `POST` | `/admin/lab/individual-test` | Create an individual lab test |

### Request Details

#### Create Individual Test (`POST /admin/lab/individual-test`)

- **Auth Required**: Yes
- **Body**: Test details (lab, category, testName)
- **Description**: Creates a single laboratory test

## Lab Reports

| Method | Route                    | Purpose                                  |
| ------ | ------------------------ | ---------------------------------------- |
| `POST` | `/app/lab-report`        | Create patient lab report                |
| `POST` | `/admin/lab-report`      | Create lab report with doctor assignment |
| `GET`  | `/admin/lab-reports`     | Get all lab reports                      |
| `GET`  | `/admin/lab-reports-p4p` | Get P4P lab reports                      |

### Request Details

#### Create Patient Lab Report (`POST /app/lab-report`)

- **Auth Required**: Yes (Employee permission)
- **File Upload**: Lab report required
- **Body**: Report details
- **Description**: Creates a lab report for an existing patient

#### Create Doctor-Assigned Lab Report (`POST /admin/lab-report`)

- **Auth Required**: Yes
- **File Upload**: Logo and lab report required
- **Body**: Report details (including user ID)
- **Description**: Creates a lab report with doctor assignment

#### Get All Lab Reports (`GET /admin/lab-reports`)

- **Auth Required**: Yes
- **Description**: Retrieves both types of lab reports (filtered by user role)

#### Get P4P Lab Reports (`GET /admin/lab-reports-p4p`)

- **Auth Required**: Yes (Employee read permission)
- **Description**: Retrieves all lab reports from P4P with limited fields

# Cemetery Management System - Burial Records & Plot Monitoring

## Project Overview

The system is a Web-based Burial Records Management and Cemetery Plot Monitoring System that is designed to replace manual processes with a centralized and digital platform. The system design is composed of modules or features, which are: map management for plotting, burial records like the time of a person’s interment, lease and ownership tracking, a public search portal, permit processing, and reporting tools. These modules are designed to work together for ensuring that all cemetery related data is accurate, organized, and easily accessible.

The system is accessed through a web platform where LGU staff manage burial records, cemetery plots, and permits. When a burial is recorded, the staff inputs the deceased’s details and assigns a plot, which is automatically updated in the database and displayed on the interactive map.
The system also tracks lease ownership and expiration, sending notifications for renewals. Users can process permits and monitor payments within the system.
For the public, a search feature allows families to easily find burial information and plot locations using basic details like name or date.

## Target Users

The proposed system is designed for several user groups involved in cemetery record management and those who need access to burial information. <br>

1. **LGU Administrators** <br>
   LGU Administrators will be in charge of the overall system. From the system’s main screen, they will be looking after who is buried where, keeping track of how full the cemetery is and when plot leases run out, approving permits , and creating reports.
2. **Cemetery Office Staffs** <br>
   Cemetery staff will put burial information into the system, get it up to date, handle requests for permits, and find burial details when they are required. The system will help reduce manual paperwork and improve record retrieval.
3. **Families of the Deceased** <br>
   Bereaved families will be able to look for burial details, find the exact place of the grave, and see what’s happening with cemetery plot leases on the system’s public section.
4. **OFWs and Remote Relatives** <br>
   OFWs and relatives living outside the area can access burial information remotely through the web-based system without having to visit the cemetery office.
5. **Government Agencies** <br>
   Organizations from the government, for example, the Government Service Insurance System (GSIS) and the Social Security System (SSS), can use the system to confirm details of burials for things like insurance payments and official paperwork.

## Scope and Limitations

**In Scope**: <br>

- Burial record digitization and management
- Cemetery plot mapping (modular)
- Lease ownership tracking and renewal status
- Permit request workflow (interment, exhumation, transfer)
- Public search portal
- Admin dashboard
- Role-based access (admin, staff, public)<br>

**Limitations**: <br>

- Financial/payment gateway integration
- Permit Application submission for public user
- Real time notification
- Mobile app
- Settings is a display showing static system data
- Reports is a display showing mock data
- Integration with PSA or national civil registry
- Multiple cemetery management (single LGU cemetery only)
- Generate/view/export reports (future recommendation implementation)

## Technology Stack Used

**Frontend**: React.js<br>
**Backend**: Node.js + Express.js <br>
**Database**: MongoDB <br>
**Authentication**: JWT (JSON Web Tokens)

## System Features

- **Cemetery Map** - Interactive grid view of all plots with color-coded status
- **Burial Records** - Track deceased information, interment dates, and plot assignments
- **Lease Management** - Manage plot leases with renewal and termination
- **Permit System** - Handle burial, exhumation, and transfer permits
- **Role-Based Access** - Admin, Staff, and Public user roles
- **Public Portal** - Search burial records and view cemetery map

## Role Based Access Features

### Admin

- Allows the destructive manipulation of data such as editing and deleting throughout pages like Records, Leases and Permits.
- Datas that are deleted by the Admin are permantently removed from the database.
- The one responsible for approving or rejecting permits, the staff's next action depends on this act.
- Capable of adding new modules to the map.

### Staff

- The one responsible for adding new permits such as Interment, Exhumation and Transfer.
- After an Admin approves a permit, the approved permit are sent to the records tab where the staff only has access to complete them. They are stored in the records once the Staff completes the permit.
- Responsible for the Leases. Staffs can notify lease expiration through email and renew leases.
- Capable of adding new modules to the map.

### Public

- Dashboard View that allows viewing of active leases associated wih a public user's submitted email.
- Responsive search bar that searches through the database and returns plot number or deceased information.
- Cemetery map located at the dashboard view is automatically highlighted when plot number or deceased name is searched.
- Cemetery map tab shows 'Total Plots', 'Available', 'Reserved', and 'Occupied' stats. The plot representing a square with different color indicators details its corresponding information when clicked, would show the ff: lease, reservation, details of the deceased, and if it is available or occupied.
- Permits/Reports/Leases/Records are hidden from view

## Installation & Setup

### Prerequisites

- Node.js v18.x or higher (Tested on v24.x)
- MongoDB (local or Atlas)
- Git: for cloning repo

### Clone repository
```bash
git clone https://github.com/kaiskidex/burial-management-system.git
cd burial-management-system
```

### Backend Setup

1. Navigate to server folder

```bash
cd server
```

2. Install backend dependencies

```bash
npm install
```

3. Environment Configuration <br>
   **Step 1**: Locate the `.env.example` file in the `/server` directory. <br>
   **Step 2**: Edit `.env.example` file to `.env`. <br>
   **Step 3**: Open `.env` and fill in your unique `MONGO_URI` and `JWT_SECRET`.

4. Start server

```bash
npm start
```

### Frontend Setup

1. Navigate to client folder

```bash
cd client
```

2. Install dependencies

```bash
npm install
```

3. Environment Configuration <br>
Create a .env file and insert this
```
REACT_APP_API_URL=http://localhost:5000
```

4. Start frontend

```bash
npm start
```

### Testing the Setup

1. Backend should run on [http://localhost:5000](http://localhost:5000)
2. Frontend should run on [http://localhost:3000](http://localhost:3000)
3. Test API: [http://localhost:5000/health](http://localhost:5000/health)


## Team Members

Cabigao, Kayleigh (backend-frontend coder) <br>
Baltazar, Rigor (backend-frontend coder) <br>
Punzalan, Vince Adrian (Research Paper/Documentation)<br>
Calma, Jon Bernard (DFD and Context Diagram )<br>
Cortez, Rexine Bradley (DFD and Context Diagram) <br>

# System Diagrams

Technology-agnostic views of how FastQ works. Every diagram below is complete
PlantUML source — copy a block into any PlantUML renderer to generate the image.

## Shared vocabulary

| Term | Meaning in these diagrams |
| --- | --- |
| Client Device | Any browser-based device used by a customer or an operator. |
| Server-Side Renderer | Produces a complete first view before the client becomes interactive. |
| Realtime Engine | Delivers live views and accepts commands from connected devices. |
| Server-Side Logic | Validates, authorises, and applies business rules. |
| Data Documents | Durable structured records that the platform reads and writes. |
| Authentication Service | Verifies identity and maintains sessions. |
| Background Scheduler | Runs timed maintenance without a user request. |
| Map Tile Service | Supplies base map imagery for visual discovery. |
| Device Location Sensor | Provides coordinates after the person gives consent. |
| Scannable Code | An on-site code that opens a queue entry point. |

## Methodology principles

1. **Render first, then live.** A page arrives complete, then subscribes to a
   live view that keeps it current.
2. **Commands are transactional.** Every change is validated, authorised, and
   applied as one unit.
3. **Reads are scoped.** A query only returns documents the caller may see.
4. **Time is data.** Expiry, grace, and validity deadlines are stored and
   evaluated against an explicit clock.
5. **Ephemeral by default.** Announcements carry a lifetime and disappear on
   their own.
6. **Bounded maintenance.** Scheduled jobs work in small batches and continue
   themselves until the work is done.
7. **Consent-based context.** Location is requested only when discovery needs it.

---

## 1. System Context

```plantuml
@startuml
title System Context
left to right direction

actor "Customer" as Customer
actor "Business Operator" as Operator

rectangle "Platform Boundary" {
  component "Server-Side Renderer" as SSR
  component "Client-Side Experience" as UX
  component "Realtime Engine" as Engine
  component "Server-Side Logic" as Logic
  database "Data Documents" as Data
  component "Authentication Service" as Auth
  component "Background Scheduler" as Scheduler
}

cloud "Third-Party Services" as Third {
  component "Map Tile Service" as Tiles
}

Customer --> UX
Operator --> UX
UX --> SSR : initial render
UX --> Engine : live reads and commands
SSR --> Logic : render-time reads
Engine --> Logic : authorised calls
Logic --> Data : read and write documents
Logic --> Auth : verify identity and role
Scheduler --> Logic : timed triggers
UX --> Tiles : map imagery
@enduml
```

## 2. Layered Architecture

```plantuml
@startuml
title Layered Architecture
top to bottom direction

package "Presentation Layer" as P {
  [Server-Side Renderer] as SSR
  [Client-Side Experience] as UX
}

package "Interaction Layer" as I {
  [Live Query Subscriptions] as Q
  [Command Handlers] as C
}

package "Domain Layer" as D {
  [Access Rules] as A
  [Queue Rules] as QRule
  [Booking Rules] as BR
  [Discovery Rules] as DR
  [Announcement Rules] as AR
}

package "Persistence Layer" as S {
  database "Data Documents" as DB
}

package "Automation Layer" as AU {
  [Background Scheduler] as SCH
  [Retention Jobs] as RJ
}

SSR --> Q : initial snapshot
UX --> Q : live view
UX --> C : user commands
Q --> A : authorise reads
C --> A : authorise commands
A --> QRule
A --> BR
A --> DR
A --> AR
QRule --> DB
BR --> DB
DR --> DB
AR --> DB
SCH --> RJ : daily trigger
RJ --> DB : retention
@enduml
```

## 3. Actor Capabilities

```plantuml
@startuml
title Actor Capabilities
left to right direction

actor "Visitor" as V
actor "Customer" as C
actor "Business Operator" as O

rectangle "FastQ Platform" {
  (Discover nearby services) as UC1
  (View business profile) as UC2
  (Join a live queue) as UC3
  (Track position in real time) as UC4
  (Book an appointment) as UC5
  (Manage owned business) as UC6
  (Open, pause, or close a queue) as UC7
  (Call and serve the next person) as UC8
  (Publish an announcement) as UC9
}

V --> UC1
V --> UC2
C --> UC3
C --> UC4
C --> UC5
UC3 ..> UC4 : <<include>>
O --> UC6
UC6 ..> UC7 : <<include>>
UC6 ..> UC8 : <<include>>
UC6 ..> UC9 : <<include>>
C --|> V
O --|> V
@enduml
```

## 4. Customer Journey

```plantuml
@startuml
title Customer Journey
|Customer|
start
:Open the platform;
:Share current location (optional);
:Search by keyword, category, or distance;
:Compare nearby services;
:Open a business profile;
if (Join now or book ahead?) then (join now)
  |Customer|
  :Scan the on-site code or open the link;
  :Review prerequisites;
  :Acknowledge requirements;
  :Receive a queue token;
  |System|
  :Compute the estimated wait;
  :Broadcast the live position;
  |Customer|
  :Track position and announcements;
  :Arrive when called;
  |System|
  :Move the token to serving;
  |Customer|
  :Receive service;
else (book ahead)
  |Customer|
  :Choose an available slot;
  :Confirm the appointment;
  |System|
  :Reserve the slot;
  :Record the confirmation;
  |Customer|
  :Arrive and check in;
endif
|System|
:Close the visit;
|Customer|
:View visit history;
stop
@enduml
```

## 5. Business Onboarding and Live Operations

```plantuml

@startuml
title Business Onboarding and Live Operations

|Business Operator|
start
:Create an account;
:Register the business profile;
:Set category, address, and location;
:Define services and expected duration;
:Configure weekly availability and prerequisites;
:Publish the profile;

if (Queue or appointments?) then (Queue)
  :Open a live queue;
  :Share the scannable entry point;

  |Customer|
  :Join the queue;

  |Business Operator|
  :Monitor the live line;
  :Call the next token;
  :Serve customer or mark no-show;
  :Publish a short-lived announcement;
  :Repeat until the queue closes;
  :Close the queue;

else (Appointments)
  |Business Operator|
  :Publish bookable slots;

  |Customer|
  :Book a slot;

  |Business Operator|
  :Review the daily schedule;
  :Check in arrivals;
  :Complete visits;
endif

stop
@enduml

```

## 6. Queue Token Lifecycle

```plantuml
@startuml
title Queue Token Lifecycle
[*] --> Waiting : customer joins
Waiting --> Called : operator calls next
Waiting --> Cancelled : customer leaves
Waiting --> Expired : validity deadline passes
Called --> CheckedIn : customer arrives
Called --> NoShow : grace period elapses
Called --> Skipped : operator skips
CheckedIn --> Serving : service begins
Serving --> Completed : service finishes
Completed --> [*]
Cancelled --> [*]
NoShow --> [*]
Skipped --> [*]
Expired --> [*]

note right of Expired
  Terminal tokens remain for history and are
  removed by the daily retention job after one week.
end note
@enduml
```

## 7. Joining a Live Queue

```plantuml
@startuml
title Joining a Live Queue
autonumber

actor "Customer" as C
participant "Client Device" as CD
participant "Authentication Service" as AUTH
participant "Realtime Engine" as RE
participant "Server-Side Logic" as SL
database "Data Documents" as DB
participant "Business Dashboard" as BD

C -> CD : open the entry link or scan the code
CD -> AUTH : establish a session
AUTH --> CD : verified identity
CD -> RE : request the queue snapshot
RE -> SL : read queue and token rules
SL -> DB : fetch queue, service, and prerequisites
DB --> SL : documents
SL --> RE : snapshot and estimated wait
RE --> CD : live snapshot
CD --> C : show prerequisites and wait
C -> CD : acknowledge and join
CD -> RE : submit the join command
RE -> SL : validate prerequisites and capacity
SL -> DB : create the token document atomically
DB --> SL : token stored
SL --> RE : token accepted
RE --> CD : token and live position
RE --> BD : push the updated line
CD --> C : show token and live status
@enduml
```

## 8. Realtime Synchronisation

```plantuml
@startuml
title Realtime Synchronisation
autonumber

participant "Server-Side Renderer" as SSR
participant "Client Device A" as A
participant "Client Device B" as B
participant "Realtime Engine" as RE
participant "Server-Side Logic" as SL
database "Data Documents" as DB

SSR -> SL : request the initial snapshot
SL -> DB : read permitted documents
DB --> SL : documents
SL --> SSR : rendered view
SSR --> A : first view with data
A -> RE : subscribe to the live view
B -> RE : subscribe to the live view

A -> RE : submit a command
RE -> SL : authorise and apply
SL -> DB : write documents
DB --> SL : committed version
SL --> RE : change notification
RE --> A : updated view
RE --> B : updated view
@enduml
```

## 9. Appointment Booking

```plantuml
@startuml
title Appointment Booking
autonumber

actor "Customer" as C
participant "Client Device" as CD
participant "Realtime Engine" as RE
participant "Server-Side Logic" as SL
database "Data Documents" as DB
participant "Business Dashboard" as BD

C -> CD : choose a service and a day
CD -> RE : request availability
RE -> SL : resolve bookable slots
SL -> DB : read duration and existing bookings
DB --> SL : existing appointments
SL --> RE : free slots
RE --> CD : available slots
C -> CD : confirm a slot
CD -> RE : submit the booking
RE -> SL : verify the slot is still free
SL -> DB : create the appointment atomically
DB --> SL : appointment stored
SL --> RE : confirmation
RE --> CD : booking confirmed
RE --> BD : push the updated schedule
CD --> C : show the confirmation
@enduml
```

## 10. Discovery and Proximity Search

```plantuml
@startuml
title Discovery and Proximity Search
autonumber

actor "Visitor" as V
participant "Client Device" as CD
participant "Device Location Sensor" as GPS
participant "Realtime Engine" as RE
participant "Server-Side Logic" as SL
database "Data Documents" as DB
participant "Map Tile Service" as MAP

V -> CD : enter a keyword and filters
CD -> GPS : request position (with consent)
GPS --> CD : coordinates
CD -> RE : search with text, category, and radius
RE -> SL : validate and query
SL -> DB : match documents and bound by distance
DB --> SL : matching businesses
SL --> RE : results and total count
RE --> CD : live results
CD -> MAP : request map imagery
MAP --> CD : map tiles
CD --> V : list, map, and distances
V -> CD : open a result
CD -> RE : load the business profile
@enduml
```

## 11. Short-Lived Announcement Broadcast

```plantuml
@startuml
title Short-Lived Announcement Broadcast
autonumber

actor "Business Operator" as O
participant "Business Dashboard" as BD
participant "Realtime Engine" as RE
participant "Server-Side Logic" as SL
database "Data Documents" as DB
participant "Subscribed Customer Devices" as CDEV
participant "Background Scheduler" as SCH

O -> BD : write a message and choose a lifetime
BD -> RE : publish the announcement
RE -> SL : verify ownership and expiry
SL -> DB : store the announcement with an expiry
DB --> SL : stored
SL --> RE : accepted
RE --> CDEV : live announcement
note over CDEV : visible only while the expiry is ahead

... time passes ...

SCH -> SL : daily retention run
SL -> DB : remove announcements expired for over a day
@enduml
```

## 12. Scheduled Retention Cleanup

```plantuml
@startuml
title Scheduled Retention Cleanup
start
:Daily trigger fires;
fork
  :Scan the oldest queue tokens;
  :Delete a bounded batch;
  :Schedule a continuation while more remain;
  :Repeat until the one-week cutoff is clear;
fork again
  :Scan announcements past their expiry;
  :Delete announcements expired for over a day;
  :Finish the announcement pass;
end fork
:Release resources;
stop
@enduml
```

## 13. Authentication and Authorisation

```plantuml
@startuml
title Authentication and Authorisation
autonumber

actor "User" as U
participant "Client Device" as CD
participant "Authentication Service" as AUTH
participant "Server-Side Renderer" as SSR
participant "Server-Side Logic" as SL
participant "Realtime Engine" as RE
database "Data Documents" as DB

U -> CD : sign up or sign in
CD -> AUTH : submit credentials
AUTH --> CD : establish a session
CD -> SSR : request a protected page
SSR -> AUTH : verify the session
AUTH --> SSR : identity and role
alt session valid
  SSR -> SL : fetch the permitted view
  SL -> DB : read scoped documents
  DB --> SL : permitted data
  SL --> SSR : rendered page
  SSR --> CD : page with session
  CD -> RE : open live subscriptions
  RE -> SL : authorise each request
  SL -> DB : read only owned or permitted documents
else session invalid
  SSR --> CD : redirect to sign-in
end
@enduml
```

## 14. Data Model

```plantuml
@startuml
title Data Model

entity "User Account" as User {
  * id : identifier
  --
  name : text
  email : text
  phone : text
  isActive : flag
  createdAt : timestamp
  updatedAt : timestamp
}

entity "Business Profile" as Biz {
  * id : identifier
  --
  # ownerId : reference
  name : text
  description : text
  category : text
  location : coordinates
  searchText : text
  status : active, suspended, archived
  createdAt : timestamp
  updatedAt : timestamp
}

entity "Service Offering" as Svc {
  * id : identifier
  --
  # businessId : reference
  name : text
  description : text
  durationMinutes : number
  queueEnabled : flag
  appointmentsEnabled : flag
  isActive : flag
}

entity "Queue" as Q {
  * id : identifier
  --
  # businessId : reference
  # serviceId : reference
  name : text
  description : text
  status : active, paused, closed
  gracePeriodMinutes : number
  prerequisites : list
  createdAt : timestamp
  updatedAt : timestamp
}

entity "Queue Token" as Tok {
  * id : identifier
  --
  # businessId : reference
  # queueId : reference
  # serviceId : reference
  # customerId : reference
  tokenNumber : number
  status : waiting, called, checkedIn, serving, completed, cancelled, noShow, skipped, expired
  joinedAt : timestamp
  calledAt : timestamp
  checkedInAt : timestamp
  serviceStartedAt : timestamp
  completedAt : timestamp
  graceDeadlineAt : timestamp
  expiresAt : timestamp
  estimatedWaitMinutes : number
  updatedAt : timestamp
}

entity "Appointment" as Appt {
  * id : identifier
  --
  # businessId : reference
  # serviceId : reference
  # userId : reference
  scheduledStart : timestamp
  scheduledEnd : timestamp
  status : booked, checkedIn, completed, cancelled, noShow
  notes : text
  createdAt : timestamp
  updatedAt : timestamp
}

entity "Announcement" as Ann {
  * id : identifier
  --
  # businessId : reference
  # queueId : reference (optional)
  # createdBy : reference
  message : text
  createdAt : timestamp
  expiresAt : timestamp
}

User ||--o{ Biz : owns
Biz ||--o{ Svc : offers
Svc ||--o{ Q : defines
Biz ||--o{ Q : operates
Q ||--o{ Tok : issues
Svc ||--o{ Tok : applies to
User ||--o{ Tok : holds
User ||--o{ Appt : books
Biz ||--o{ Appt : receives
Svc ||--o{ Appt : scheduled for
Biz ||--o{ Ann : publishes
User ||--o{ Ann : authors
Q |o--o{ Ann : targets
@enduml
```

## 15. Deployment Topology

```plantuml
@startuml
title Deployment Topology
top to bottom direction

node "Customer Device" as CD {
  component "Browser Experience" as CB
}

node "Business Device" as BD {
  component "Operator Experience" as OB
}

cloud "Managed Runtime" as RT {
  node "Edge Renderer" as EDGE {
    component "Server-Side Renderer" as SSR
  }

  node "Application Cluster" as APP {
    component "Server-Side Logic" as SL
    component "Realtime Engine" as RE
    component "Identity Service" as ID
  }

  database "Data Documents" as DB

  node "Scheduler" as SCH {
    component "Retention Jobs" as RJ
  }
}

cloud "Map Tile Service" as MAP

CD --> EDGE : page requests
BD --> EDGE : page requests
CB --> RE : live channel
OB --> RE : live channel
EDGE --> SL : render-time calls
EDGE --> ID : verify session
RE --> SL : command and query calls
RE --> ID : verify session
SL --> DB : documents
SCH --> SL : timed triggers
CB --> MAP : map imagery
@enduml
```

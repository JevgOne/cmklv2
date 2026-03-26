import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface CarmaklerDB extends DBSchema {
  drafts: {
    key: string;
    value: {
      id: string;
      data: Record<string, unknown>;
      updatedAt: number;
    };
    indexes: { "by-updatedAt": number };
  };
  vehicles: {
    key: string;
    value: {
      id: string;
      data: Record<string, unknown>;
      syncedAt: number;
    };
    indexes: { "by-syncedAt": number };
  };
  pendingActions: {
    key: string;
    value: {
      id: string;
      type: string;
      payload: Record<string, unknown>;
      createdAt: number;
      retries: number;
    };
    indexes: { "by-type": string; "by-createdAt": number };
  };
  images: {
    key: string;
    value: {
      id: string;
      draftId: string;
      blob: Blob;
      createdAt: number;
    };
    indexes: { "by-draftId": string };
  };
  contacts: {
    key: string;
    value: {
      id: string;
      name: string;
      phone: string;
      email?: string;
      address?: string;
      city?: string;
      note?: string;
      totalVehicles: number;
      totalSold: number;
      lastContactAt?: number;
      nextFollowUp?: number;
      followUpNote?: string;
      updatedAt: number;
      syncedAt: number;
    };
    indexes: { "by-name": string; "by-phone": string; "by-nextFollowUp": number };
  };
  vinCache: {
    key: string;
    value: {
      vin: string;
      data: Record<string, unknown>;
      cachedAt: number;
    };
  };
  equipmentCatalog: {
    key: string;
    value: {
      id: string;
      category: string;
      items: string[];
      syncedAt: number;
    };
    indexes: { "by-category": string };
  };
  contracts: {
    key: string;
    value: {
      id: string;
      vehicleId: string;
      data: Record<string, unknown>;
      status: string;
      createdAt: number;
    };
    indexes: { "by-vehicleId": string; "by-status": string };
  };
}

let dbPromise: Promise<IDBPDatabase<CarmaklerDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<CarmaklerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CarmaklerDB>("carmakler-offline", 3, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        // Drafts store
        if (!db.objectStoreNames.contains("drafts")) {
          const drafts = db.createObjectStore("drafts", { keyPath: "id" });
          drafts.createIndex("by-updatedAt", "updatedAt");
        }

        // Vehicles store
        if (!db.objectStoreNames.contains("vehicles")) {
          const vehicles = db.createObjectStore("vehicles", { keyPath: "id" });
          vehicles.createIndex("by-syncedAt", "syncedAt");
        }

        // Pending actions store
        if (!db.objectStoreNames.contains("pendingActions")) {
          const actions = db.createObjectStore("pendingActions", {
            keyPath: "id",
          });
          actions.createIndex("by-type", "type");
          actions.createIndex("by-createdAt", "createdAt");
        }

        // Images store
        if (!db.objectStoreNames.contains("images")) {
          const images = db.createObjectStore("images", { keyPath: "id" });
          images.createIndex("by-draftId", "draftId");
        }

        // Contacts store
        if (!db.objectStoreNames.contains("contacts")) {
          const contacts = db.createObjectStore("contacts", { keyPath: "id" });
          contacts.createIndex("by-name", "name");
          contacts.createIndex("by-phone", "phone");
          contacts.createIndex("by-nextFollowUp", "nextFollowUp");
        } else if (oldVersion < 3 && transaction) {
          // Upgrade existing contacts store with new indexes
          const contactsStore = transaction.objectStore("contacts");
          if (!contactsStore.indexNames.contains("by-phone")) {
            contactsStore.createIndex("by-phone", "phone");
          }
          if (!contactsStore.indexNames.contains("by-nextFollowUp")) {
            contactsStore.createIndex("by-nextFollowUp", "nextFollowUp");
          }
        }

        // VIN cache store
        if (!db.objectStoreNames.contains("vinCache")) {
          db.createObjectStore("vinCache", { keyPath: "vin" });
        }

        // Equipment catalog store
        if (!db.objectStoreNames.contains("equipmentCatalog")) {
          const equipment = db.createObjectStore("equipmentCatalog", {
            keyPath: "id",
          });
          equipment.createIndex("by-category", "category");
        }

        // Contracts store
        if (!db.objectStoreNames.contains("contracts")) {
          const contracts = db.createObjectStore("contracts", {
            keyPath: "id",
          });
          contracts.createIndex("by-vehicleId", "vehicleId");
          contracts.createIndex("by-status", "status");
        }
      },
    });
  }
  return dbPromise;
}

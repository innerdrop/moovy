import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { z } from "zod";
import { CreateOrderSchema, validateInput } from "@/lib/validations";

describe("Order Creation - Schema Validation", () => {
  describe("CreateOrderSchema - Valid inputs", () => {
    it("should validate a valid cash order with single vendor", () => {
      const validCashOrder = {
        items: [
          {
            productId: "prod-1",
            name: "Burger",
            price: 250.5,
            quantity: 2,
            type: "product",
          },
        ],
        paymentMethod: "cash",
        deliveryFee: 100,
        distanceKm: 2.5,
        isPickup: false,
        deliveryType: "IMMEDIATE",
      };

      const validation = validateInput(CreateOrderSchema, validCashOrder);
      expect(validation.success).toBe(true);
      expect(validation.data).toBeDefined();
      expect(validation.data?.paymentMethod).toBe("cash");
      expect(validation.data?.deliveryType).toBe("IMMEDIATE");
    });

    it("should validate a valid MercadoPago order", () => {
      const validMpOrder = {
        items: [
          {
            productId: "prod-2",
            name: "Pizza",
            price: 450,
            quantity: 1,
            type: "product",
          },
        ],
        paymentMethod: "mercadopago",
        deliveryFee: 150,
        isPickup: false,
        pointsUsed: 100,
        discountAmount: 50,
        deliveryType: "IMMEDIATE",
      };

      const validation = validateInput(CreateOrderSchema, validMpOrder);
      expect(validation.success).toBe(true);
      expect(validation.data?.paymentMethod).toBe("mercadopago");
      expect(validation.data?.pointsUsed).toBe(100);
    });

    it("should validate a pickup order (no delivery fee)", () => {
      const pickupOrder = {
        items: [
          {
            productId: "prod-3",
            name: "Coffee",
            price: 120,
            quantity: 3,
            type: "product",
          },
        ],
        isPickup: true,
        paymentMethod: "cash",
        deliveryType: "IMMEDIATE",
      };

      const validation = validateInput(CreateOrderSchema, pickupOrder);
      expect(validation.success).toBe(true);
      expect(validation.data?.isPickup).toBe(true);
      expect(validation.data?.deliveryFee).toBe(0);
    });

    it("should validate multi-vendor order with groups", () => {
      const multiVendorOrder = {
        items: [
          {
            productId: "prod-4",
            name: "Item 1",
            price: 200,
            quantity: 1,
            type: "product",
          },
          {
            productId: "prod-5",
            name: "Item 2",
            price: 300,
            quantity: 2,
            type: "listing",
          },
        ],
        groups: [
          {
            merchantId: "merchant-1",
            items: [
              {
                productId: "prod-4",
                name: "Item 1",
                price: 200,
                quantity: 1,
                type: "product",
              },
            ],
          },
          {
            sellerId: "seller-1",
            items: [
              {
                productId: "prod-5",
                name: "Item 2",
                price: 300,
                quantity: 2,
                type: "listing",
              },
            ],
          },
        ],
        paymentMethod: "mercadopago",
        deliveryFee: 200,
        deliveryType: "IMMEDIATE",
      };

      const validation = validateInput(CreateOrderSchema, multiVendorOrder);
      expect(validation.success).toBe(true);
      expect(validation.data?.groups).toHaveLength(2);
    });

    it("should provide default values for optional fields", () => {
      const minimalOrder = {
        items: [
          {
            productId: "prod-6",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
      };

      const validation = validateInput(CreateOrderSchema, minimalOrder);
      expect(validation.success).toBe(true);
      expect(validation.data?.paymentMethod).toBe("cash");
      expect(validation.data?.deliveryFee).toBe(0);
      expect(validation.data?.pointsUsed).toBe(0);
      expect(validation.data?.discountAmount).toBe(0);
      expect(validation.data?.isPickup).toBe(false);
      expect(validation.data?.deliveryType).toBe("IMMEDIATE");
    });
  });

  describe("CreateOrderSchema - Invalid inputs", () => {
    it("should reject order with empty items array", () => {
      const invalidOrder = {
        items: [],
        paymentMethod: "cash",
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
      expect(validation.error).toContain("vacío");
    });

    it("should reject item with missing required fields", () => {
      const invalidOrder = {
        items: [
          {
            name: "Item",
            price: 100,
            quantity: 1,
          },
        ],
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
    });

    it("should reject item with negative price", () => {
      const invalidOrder = {
        items: [
          {
            productId: "prod-7",
            name: "Item",
            price: -100,
            quantity: 1,
            type: "product",
          },
        ],
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
      expect(validation.error).toContain("positivo");
    });

    it("should reject item with zero quantity", () => {
      const invalidOrder = {
        items: [
          {
            productId: "prod-8",
            name: "Item",
            price: 100,
            quantity: 0,
            type: "product",
          },
        ],
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
      expect(validation.error).toContain("mínima");
    });

    it("should reject invalid payment method", () => {
      const invalidOrder = {
        items: [
          {
            productId: "prod-9",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        paymentMethod: "bitcoin",
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
    });

    it("should reject negative delivery fee", () => {
      const invalidOrder = {
        items: [
          {
            productId: "prod-10",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryFee: -50,
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
    });
  });

  describe("CreateOrderSchema - Scheduled delivery validation", () => {
    it("should reject scheduled delivery without slot times", () => {
      const invalidOrder = {
        items: [
          {
            productId: "prod-11",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryType: "SCHEDULED",
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
      expect(validation.error).toContain("horario de entrega");
    });

    it("should reject scheduled delivery with only start time", () => {
      const now = new Date();
      const futureTime = new Date(now.getTime() + 2 * 60 * 60_000); // 2 hours from now

      const invalidOrder = {
        items: [
          {
            productId: "prod-12",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryType: "SCHEDULED",
        scheduledSlotStart: futureTime.toISOString(),
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
    });

    it("should reject scheduled delivery with past time", () => {
      const pastTime = new Date(Date.now() - 60 * 60_000); // 1 hour ago
      const endTime = new Date(pastTime.getTime() + 2 * 60 * 60_000);

      const invalidOrder = {
        items: [
          {
            productId: "prod-13",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryType: "SCHEDULED",
        scheduledSlotStart: pastTime.toISOString(),
        scheduledSlotEnd: endTime.toISOString(),
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
      expect(validation.error).toContain("1.5 horas");
    });

    it("should reject scheduled delivery with less than 1.5 hours anticipation", () => {
      const now = new Date();
      const tooSoonTime = new Date(now.getTime() + 30 * 60_000); // Only 30 minutes from now
      const endTime = new Date(tooSoonTime.getTime() + 2 * 60 * 60_000);

      const invalidOrder = {
        items: [
          {
            productId: "prod-14",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryType: "SCHEDULED",
        scheduledSlotStart: tooSoonTime.toISOString(),
        scheduledSlotEnd: endTime.toISOString(),
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
      expect(validation.error).toContain("1.5 horas");
    });

    it("should reject scheduled delivery with end time before start time", () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 2 * 60 * 60_000);
      const endTime = new Date(startTime.getTime() - 1 * 60 * 60_000); // 1 hour before start

      const invalidOrder = {
        items: [
          {
            productId: "prod-15",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryType: "SCHEDULED",
        scheduledSlotStart: startTime.toISOString(),
        scheduledSlotEnd: endTime.toISOString(),
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
      expect(validation.error).toContain("posterior");
    });

    it("should reject scheduled delivery with slot duration less than 1 hour", () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 2 * 60 * 60_000);
      const endTime = new Date(startTime.getTime() + 30 * 60_000); // 30 minutes

      const invalidOrder = {
        items: [
          {
            productId: "prod-16",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryType: "SCHEDULED",
        scheduledSlotStart: startTime.toISOString(),
        scheduledSlotEnd: endTime.toISOString(),
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
      expect(validation.error).toContain("duración");
    });

    it("should reject scheduled delivery with slot duration more than 3 hours", () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 2 * 60 * 60_000);
      const endTime = new Date(startTime.getTime() + 4 * 60 * 60_000); // 4 hours

      const invalidOrder = {
        items: [
          {
            productId: "prod-17",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryType: "SCHEDULED",
        scheduledSlotStart: startTime.toISOString(),
        scheduledSlotEnd: endTime.toISOString(),
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
      expect(validation.error).toContain("duración");
    });

    it("should accept valid scheduled delivery with 2 hour slot", () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 2 * 60 * 60_000); // 2 hours from now
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60_000); // 2-hour slot

      const validOrder = {
        items: [
          {
            productId: "prod-18",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryType: "SCHEDULED",
        scheduledSlotStart: startTime.toISOString(),
        scheduledSlotEnd: endTime.toISOString(),
      };

      const validation = validateInput(CreateOrderSchema, validOrder);
      expect(validation.success).toBe(true);
      expect(validation.data?.deliveryType).toBe("SCHEDULED");
    });

    it("should reject scheduled delivery outside business hours (before 9 AM)", () => {
      // Create a date at 8 AM (outside business hours)
      const date = new Date();
      date.setHours(8, 0, 0, 0);
      // If it's already past 8 AM today, schedule for tomorrow
      if (date <= new Date()) {
        date.setDate(date.getDate() + 1);
      }

      const startTime = date;
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60_000);

      const invalidOrder = {
        items: [
          {
            productId: "prod-19",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryType: "SCHEDULED",
        scheduledSlotStart: startTime.toISOString(),
        scheduledSlotEnd: endTime.toISOString(),
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
      expect(validation.error).toContain("horario de atención");
    });

    it("should reject scheduled delivery outside business hours (at 22 or later)", () => {
      // Create a date at 22:00 (10 PM) or later (outside business hours)
      const date = new Date();
      date.setHours(22, 0, 0, 0);
      // If it's already past this time today, schedule for tomorrow
      if (date <= new Date()) {
        date.setDate(date.getDate() + 1);
      }

      const startTime = date;
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60_000);

      const invalidOrder = {
        items: [
          {
            productId: "prod-20",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryType: "SCHEDULED",
        scheduledSlotStart: startTime.toISOString(),
        scheduledSlotEnd: endTime.toISOString(),
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
      expect(validation.error).toContain("horario de atención");
    });

    it("should accept scheduled delivery during valid business hours (9 AM - 9:59 PM)", () => {
      // Create a date at 15:00 (3 PM) - definitely within business hours
      const date = new Date();
      date.setHours(15, 0, 0, 0);
      // If it's already past 3 PM today, schedule for tomorrow
      if (date <= new Date()) {
        date.setDate(date.getDate() + 1);
      }

      const startTime = date;
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60_000);

      const validOrder = {
        items: [
          {
            productId: "prod-21",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryType: "SCHEDULED",
        scheduledSlotStart: startTime.toISOString(),
        scheduledSlotEnd: endTime.toISOString(),
      };

      const validation = validateInput(CreateOrderSchema, validOrder);
      expect(validation.success).toBe(true);
    });

    it("should reject scheduled delivery more than 48 hours ahead", () => {
      const now = new Date();
      const tooFarAhead = new Date(now.getTime() + 49 * 60 * 60_000); // 49 hours from now
      const endTime = new Date(tooFarAhead.getTime() + 2 * 60 * 60_000);

      const invalidOrder = {
        items: [
          {
            productId: "prod-22",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryType: "SCHEDULED",
        scheduledSlotStart: tooFarAhead.toISOString(),
        scheduledSlotEnd: endTime.toISOString(),
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
      expect(validation.error).toContain("48 horas");
    });

    it("should accept scheduled delivery exactly 48 hours ahead", () => {
      const now = new Date();
      const maxTime = new Date(now.getTime() + 48 * 60 * 60_000); // Exactly 48 hours
      const endTime = new Date(maxTime.getTime() + 2 * 60 * 60_000);

      const validOrder = {
        items: [
          {
            productId: "prod-23",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryType: "SCHEDULED",
        scheduledSlotStart: maxTime.toISOString(),
        scheduledSlotEnd: endTime.toISOString(),
      };

      const validation = validateInput(CreateOrderSchema, validOrder);
      expect(validation.success).toBe(true);
    });
  });

  describe("CreateOrderSchema - Address validation", () => {
    it("should accept order with addressId", () => {
      const orderWithAddressId = {
        items: [
          {
            productId: "prod-24",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        addressId: "addr-1",
      };

      const validation = validateInput(CreateOrderSchema, orderWithAddressId);
      expect(validation.success).toBe(true);
      expect(validation.data?.addressId).toBe("addr-1");
    });

    it("should accept order with addressData", () => {
      const orderWithAddressData = {
        items: [
          {
            productId: "prod-25",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        addressData: {
          street: "Avenida Maipú",
          number: "123",
          floor: "4A",
          city: "Ushuaia",
          latitude: -54.8019,
          longitude: -68.3029,
        },
      };

      const validation = validateInput(CreateOrderSchema, orderWithAddressData);
      expect(validation.success).toBe(true);
      expect(validation.data?.addressData?.street).toBe("Avenida Maipú");
    });

    it("should reject addressData with missing required street", () => {
      const invalidOrder = {
        items: [
          {
            productId: "prod-26",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        addressData: {
          number: "123",
        },
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
    });
  });

  describe("CreateOrderSchema - Notes validation", () => {
    it("should accept order with delivery notes", () => {
      const orderWithNotes = {
        items: [
          {
            productId: "prod-27",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryNotes: "Please ring the doorbell twice",
      };

      const validation = validateInput(CreateOrderSchema, orderWithNotes);
      expect(validation.success).toBe(true);
      expect(validation.data?.deliveryNotes).toBe("Please ring the doorbell twice");
    });

    it("should reject delivery notes exceeding 500 characters", () => {
      const longNotes = "a".repeat(501);
      const invalidOrder = {
        items: [
          {
            productId: "prod-28",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryNotes: longNotes,
      };

      const validation = validateInput(CreateOrderSchema, invalidOrder);
      expect(validation.success).toBe(false);
    });

    it("should accept null delivery notes", () => {
      const orderWithNullNotes = {
        items: [
          {
            productId: "prod-29",
            name: "Item",
            price: 100,
            quantity: 1,
            type: "product",
          },
        ],
        deliveryNotes: null,
      };

      const validation = validateInput(CreateOrderSchema, orderWithNullNotes);
      expect(validation.success).toBe(true);
    });
  });
});

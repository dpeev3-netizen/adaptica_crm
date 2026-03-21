// @ts-nocheck
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';



export const createCustomFieldValues = async (req: Request, res: Response) => {
  try {
    const { fieldId, entityId, value, type } = await req.json();

    if (!fieldId || !entityId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let textValue = null;
    let numberValue = null;
    let dateValue = null;
    let booleanValue = null;

    if (type === "NUMBER") {
      numberValue = typeof value === "number" ? value : parseFloat(value);
    } else if (type === "DATE") {
      dateValue = new Date(value);
    } else if (type === "BOOLEAN") {
      booleanValue = value === "true" || value === true;
    } else {
      textValue = String(value);
    }

    const customFieldValue = await prisma.customFieldValue.upsert({
      where: {
        fieldId_entityId: {
          fieldId,
          entityId,
        },
      },
      update: {
        textValue,
        numberValue,
        dateValue,
        booleanValue,
      },
      create: {
        fieldId,
        entityId,
        textValue,
        numberValue,
        dateValue,
        booleanValue,
      },
    });

    return res.json(customFieldValue);
  } catch (error) {
    console.error("Error saving custom field value:", error);
    return res.status(500).json({ error: "Failed to save custom field value" });
  }
}



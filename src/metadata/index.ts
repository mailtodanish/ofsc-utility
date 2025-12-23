import { createExcelFile } from "../utilities";
import * as ActivityTypesGroups from "./activityTypeGroup";
import * as ActivityTypes from "./activityTypes";
import * as ApplictaionsIntegrations from "./applictaionsIntegration";
import * as Capacity from "./capacity";
import * as CapacityCategories from "./capacityCategories";
import * as Form from "./form";
import * as InventoryTypes from "./inventoryTypes";
import * as Language from "./languages";
import * as NonWorkingReason from "./nonWorkingReasons";
import * as Properties from "./properties";
import * as ResourceType from "./resourceTypes";
import * as Shift from "./shifts";
import * as TimeSlots from "./timeSlots";
import * as WorkSkills from "./workSkillConditions";
import * as WorkZoneKey from "./workZoneKey";
import * as WorkZone from "./workZones";

export async function createConfigurationFile(
    clientId: string,
    clientSecret: string,
    instanceUrl: string,
    fileName: string = "OFSC_CONFIGURATION_SHEET.xlsx"
) {
    let sheetDataActivityType = await ActivityTypes.getActivityTypesMetaData(clientId, clientSecret, instanceUrl);
    let sheetDataActivityTypeGroup = await ActivityTypesGroups.getActivityTypesGroupsMetaData(clientId, clientSecret, instanceUrl);
    let sheetDataApplictaionsIntegrations = await ApplictaionsIntegrations.getApplictaionsIntegrationsDetailMetaData(clientId, clientSecret, instanceUrl);
    let sheetDataCapacity = await Capacity.getCapacityMetaData(clientId, clientSecret, instanceUrl);
    let sheetDataCapacityCategories = await CapacityCategories.getCapacityCategoriesMetaData(clientId, clientSecret, instanceUrl);
    let sheetDataForm = await Form.getFormsMetaData(clientId, clientSecret, instanceUrl);
    let sheetDataInventoryTypes = await InventoryTypes.getInventoryTypesMetaData(clientId, clientSecret, instanceUrl);
    let sheetDataLanguage = await Language.getLangugaesMetaData(clientId, clientSecret, instanceUrl);
    let sheetDataNonWorkingReason = await NonWorkingReason.getNonWorkingReasonMetaData(clientId, clientSecret, instanceUrl);
    let sheetDataResourceTypes = await ResourceType.getResourceTypesMetaData(clientId, clientSecret, instanceUrl);
    let sheetDataShifts = await Shift.getShiftMetaData(clientId, clientSecret, instanceUrl);
    let sheetDataTimeSlots = await TimeSlots.getTimeSlotsMetaData(clientId, clientSecret, instanceUrl);
    let sheetDataWorkSkillsConsitions = await WorkSkills.getWorkSkillsMetaData(clientId, clientSecret, instanceUrl);
    let sheetDataWorkZoneKey = await WorkZoneKey.getWorkZoneKeyMetaData(clientId, clientSecret, instanceUrl);    
    let sheetDataWorkZones = await WorkZone.getWorkZonesMetaData(clientId, clientSecret, instanceUrl);   
    let allUsedPropes = [
        ...sheetDataWorkZoneKey.props, 
        ...sheetDataWorkSkillsConsitions.props,
        ...sheetDataInventoryTypes.props
    ];
    let sheetDataProperties = await Properties.getPropertiesMetaData(clientId, clientSecret, instanceUrl,allUsedPropes);
    let sheets = Object.assign({}, 
        sheetDataActivityType, 
        sheetDataActivityTypeGroup, 
        sheetDataApplictaionsIntegrations, 
        sheetDataCapacity,
        sheetDataCapacityCategories,
        sheetDataForm,
        sheetDataInventoryTypes.data,
        sheetDataLanguage,
        sheetDataNonWorkingReason, 
        sheetDataResourceTypes,
        sheetDataShifts,
        sheetDataTimeSlots,
        sheetDataWorkSkillsConsitions.data,
        sheetDataWorkZoneKey.data,
        sheetDataWorkZones,
        sheetDataProperties
    );
    createExcelFile(sheets, fileName);

}



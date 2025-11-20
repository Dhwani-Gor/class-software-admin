'use client';

import { useEffect, useState } from "react";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Checkbox,
    Select,
    MenuItem,
    TextField,
    Card,
    CardContent,
    RadioGroup,
    FormControl,
    Radio,
    Box,
    Button,
    Grid2,
    Tabs,
    Tab,
    FormControlLabel,
    Pagination
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { toast } from "react-toastify";
import { getAllClients } from "@/api";
import CommonButton from "../CommonButton";


const POSITION_OPTIONS = [
    { code: "P", name: "Port" },
    { code: "C", name: "Centre" },
    { code: "S", name: "Starboard" },
    { code: "F", name: "Forward" },
    { code: "A", name: "Aft" },
    { code: "U", name: "Upper" },
    { code: "L", name: "Lower" },
    { code: "PI", name: "Port Inner" },
    { code: "PO", name: "Port Outer" },
    { code: "PF", name: "Port Ford" },
    { code: "PA", name: "Port Aft" },
    { code: "SI", name: "Starboard Inner" },
    { code: "SO", name: "Starboard Outer" },
    { code: "SF", name: "Starboard Ford" },
    { code: "SA", name: "Starboard Aft" },
    { code: "SU", name: "Starboard Upper" },
    { code: "SL", name: "Starboard Lower" },
    { code: "PU", name: "Port Upper" },
    { code: "PL", name: "Port Lower" },
];

// Section definitions with sequential IDs
const MACHINERY_SECTIONS = {
    1: {
        sectionId: "machinery_list",
        sectionName: "Main Engine",
        rows: [
            { id: 1, label: "Main journal and bearing", hasFromTo: true, isDue: true, isFrom: false },
            { id: 2, label: "O.F. injection pump, h.p .o.f. pipes & shielding", hasFromTo: true, isDue: true, isFrom: false },
            { id: 3, label: "O.F. injection pump and complete o.f. system for common rail system", hasFromTo: true, isDue: true, isFrom: false },

            { id: 4, label: "Insulation exhaust manifold and piping", hasPosition: true, isDue: true, isFrom: false },
            { id: 5, label: "Hydraulic pump for exhaust valves", hasPosition: true, isDue: true, isFrom: false },
            { id: 6, label: "Crankcase doors and relief devices", hasPosition: true, isDue: true, isFrom: false },
            { id: 7, label: "Scavenge relief devices", hasPosition: true, isDue: true, isFrom: false },
            { id: 8, label: "Crankshaft alignment", hasPosition: true, isDue: true, isFrom: false },
            { id: 9, label: "Vibration damper/de-tuner", hasPosition: true, isDue: true, isFrom: false },
            { id: 10, label: "Oil mist detector", hasPosition: true, isDue: true, isFrom: false },
            { id: 11, label: "Camshaft/s and camshaft/s drive", hasPosition: true, isDue: true, isFrom: false },
            { id: 12, label: "Bed plates, frames, tie rods, holding down bolts and chocks", hasPosition: true, isDue: true, isFrom: false },
            { id: 13, label: "Starting and reversing gear", hasPosition: true, isDue: true, isFrom: false },
            { id: 14, label: "Super charger/Turbocharger", hasPosition: true, isDue: true, isFrom: false },
            { id: 15, label: "Electric scavenge blower/ scavenge pump", hasPosition: true, isDue: true, isFrom: false },
            { id: 16, label: "Piston cooling water air compressor", hasPosition: true, isDue: true, isFrom: false },
            { id: 17, label: "Main engine air cooler", hasPosition: true, isDue: true, isFrom: false },
            { id: 18, label: "Engine under piston scavenge air cooler", hasPosition: true, isDue: true, isFrom: false },
            { id: 19, label: "Main engine attached bilge pump", hasPosition: true, isDue: true, isFrom: false },
            { id: 20, label: "Main engine attached sea water cooling pump", hasPosition: true, isDue: true, isFrom: false },
            { id: 21, label: "Main engine attached fresh water cooling pump", hasPosition: true, isDue: true, isFrom: false },
            { id: 22, label: "Main engine attached lub. oil circulating pump", hasPosition: true, isDue: true, isFrom: false },
            { id: 23, label: "Main engine attached O.F. booster pump", hasPosition: true, isDue: true, isFrom: false },
            { id: 24, label: "Main engine attached air compressor", hasPosition: true, isDue: true, isFrom: false },
            { id: 25, label: "Main engine attached rocker arm lub. oil pump", hasPosition: true, isDue: true, isFrom: false },
            { id: 26, label: "Coupling", hasPosition: true, isDue: true, isFrom: false },
            { id: 27, label: "Thrust Bearing", hasPosition: true, isDue: true, isFrom: false },
            { id: 28, label: "Engine trial", hasPosition: true, isDue: true, isFrom: false }
        ]

    },
    2: {
        sectionId: "reduction_gearing",
        sectionName: "Main Reduction Gearing",
        rows: [
            { id: 0, label: "Main Reduction Gearing", hasPosition: true, isDue: true, isFrom: false },
            { id: 1, label: "Pinion/s and wheel/s", hasPosition: false, isDue: true, isFrom: false },
            { id: 2, label: "Shaft/s couplings, clutch(es) and bearing/s", hasPosition: false, isDue: true, isFrom: false },
            { id: 3, label: "Thrust Bearing", hasPosition: false, isDue: true, isFrom: false },
            { id: 4, label: "Coupling/clutch for shaft generator", hasPosition: false, isDue: true, isFrom: false },
            { id: 5, label: "Attached lub. oil pump", hasPosition: false, isDue: true, isFrom: false },
            { id: 6, label: "Attached lub. oil cooler", hasPosition: false, isDue: true, isFrom: false },
            { id: 7, label: "Elastic coupling", hasPosition: false, isDue: true, isFrom: false },
            { id: 8, label: "Foundation bolts and chocks", hasPosition: false, isDue: true, isFrom: false }]
    },
    3: {
        sectionId: "electric_propulsion",
        sectionName: "Electric Propulsion Equipment",
        rows: [
            { id: 0, label: "Electric Propulsion Equipment", hasPosition: true, isDue: true, isFrom: false },
            { id: 1, label: "Generator complete", hasPosition: true, isDue: true, isFrom: false },
            { id: 2, label: "Control gear, cables, etc. connected with propulsion equipment", hasPosition: true, isDue: true, isFrom: false },
            { id: 3, label: "Insulation resistance of propulsion equipment", hasPosition: true, isDue: true, isFrom: false },
            { id: 4, label: "Governing", hasPosition: true, isDue: true, isFrom: false },
            { id: 5, label: "Propulsion motor", hasPosition: true, isDue: true, isFrom: false },
            { id: 6, label: "Cooling arrangement for propulsion unit", hasPosition: true, isDue: true, isFrom: false },
            { id: 7, label: "Air Gap", hasPosition: true, isDue: true, isFrom: false },
            { id: 8, label: "Holding Down Bolts and Chocks of Propulsion Motor", hasPosition: true, isDue: true, isFrom: false },
            { id: 9, label: "Propulsion Motor Trial", hasPosition: true, isDue: true, isFrom: false }
        ]
    },
    4: {
        sectionId: "steam_turbine_propulsion",
        sectionName: "Main Steam Turbine Propulsion Equipment",
        rows: [
            { id: 1, label: "Turbine rotor, casing, diaphragm, nozzle, blade and shroud", hasPosition: true },
            { id: 2, label: "Turbine Shaft Bearings", hasPosition: true },
            { id: 3, label: "Turbine Thrust Bearings", hasPosition: true },
            { id: 4, label: "Governing system", hasPosition: true },
            { id: 5, label: "Holding Down Bolts and Chocks", hasPosition: true },
            { id: 6, label: "Propulsion equipment trial", hasPosition: true }
        ]
    },
    5: {
        sectionId: "shafting_arrangement",
        sectionName: "Shafting Arrangement",
        rows: [
            { id: 1, label: "Thrust shaft and bearings", hasPosition: true },
            { id: 2, label: "Intermediate shaft and bearing/s", hasPosition: true },
            { id: 3, label: "Coupling/clutch for shafting", hasPosition: true }
        ]
    },
    6: {
        sectionId: "auxiliary_equipment",
        sectionName: "Auxiliary Equipment",
        rows: [
            { id: 1, label: "Generator aux. engine with attachments and coolers", hasPosition: true },
            { id: 2, label: "Emergency generator engine with attachments and coolers", hasPosition: true },
            { id: 3, label: "Steering gear machinery unit", hasPosition: true },
            { id: 4, label: "Hand operated steering gear", hasPosition: true },
            { id: 5, label: "Windlass machinery unit", hasPosition: true },
            { id: 6, label: "First start arrangement trial", hasPosition: false }
        ]
    },
    7: {
        sectionId: "air_system_equipment",
        sectionName: "Air System Equipment",
        rows: [
            { id: 1, label: "Starting air comp. incl. cooler & safety devices", hasPosition: true },
            { id: 2, label: "Aux. air comp. incl. cooler & safety devices", hasPosition: true },
            { id: 3, label: "Control air comp. incl. cooler & safety devices", hasPosition: true },
            { id: 4, label: "Topping up air comp. incl. cooler & safety devices", hasPosition: true },
            { id: 5, label: "Emergency air comp. incl. cooler, safety devices & engine", hasPosition: true },
            { id: 6, label: "Starting air receiver and safety devices", hasPosition: true },
            { id: 7, label: "Aux. air receiver and safety devices", hasPosition: true },
            { id: 8, label: "Emergency air receiver and safety devices", hasPosition: true },
            { id: 9, label: "Control air receiver and safety devices", hasPosition: true },
            { id: 10, label: "Control air dryer", hasPosition: true }
        ]
    },
    7: {
        sectionId: "fuel_system",
        sectionName: "Fuel System",
        rows: [
            { id: 1, label: "Fuel system", hasPosition: false },
            { id: 2, label: "Oil fuel transfer pump", hasPosition: true },
            { id: 3, label: "D.O. transfer pump", hasPosition: true },
            { id: 4, label: "O.F. service pump", hasPosition: true },
            { id: 5, label: "O.F. circulating pump", hasPosition: true },
            { id: 6, label: "O.F. booster pump", hasPosition: true },
            { id: 7, label: "D.O. service pump", hasPosition: true },
            { id: 8, label: "D.O. booster pump", hasPosition: true },
            { id: 9, label: "Blend O.F. booster pump", hasPosition: true },
            { id: 10, label: "O.F. pump for main boiler", hasPosition: true },
            { id: 11, label: "O.F. pump for aux. boiler", hasPosition: true },
            { id: 12, label: "Main engine O.F. heater", hasPosition: true },
            { id: 13, label: "Aux. boiler O.F. unit heater", hasPosition: true },
            { id: 14, label: "Purifier O.F. heater", hasPosition: true },
            { id: 15, label: "O.F. blender", hasPosition: true }
        ]
    },
    8: {
        sectionId: "fuel_system",
        sectionName: "Fuel System",
        rows: [
            { id: 1, label: "Lubricating oil system", hasFromTo: false },

            { id: 2, label: "Main engine lub. oil pump", hasPosition: true },
            { id: 3, label: "Crosshead lub. oil pump", hasPosition: true },
            { id: 4, label: "Aux. engine lub. oil pump", hasPosition: true },
            { id: 5, label: "Gear box lub. oil pump", hasPosition: true },
            { id: 6, label: "Gear box standby pump", hasPosition: true },
            { id: 7, label: "Stern tube lub. oil pump", hasPosition: true },
            { id: 8, label: "Forward gland circulating pump", hasPosition: true },
            { id: 9, label: "Camshaft lub. oil pump", hasPosition: true },
            { id: 10, label: "Rocker arm lub. oil pump", hasPosition: true },
            { id: 11, label: "Turbocharger lub. oil pump", hasPosition: true },

            { id: 12, label: "Main engine lub. oil cooler", hasPosition: true },
            { id: 13, label: "Aux. engine lub. oil cooler", hasPosition: true },
            { id: 14, label: "Camshaft lub. oil cooler", hasPosition: true },
            { id: 15, label: "Turbocharger lub. oil cooler", hasPosition: true },
            { id: 16, label: "Gear box lub. oil cooler", hasPosition: true },
            { id: 17, label: "Stern tube lub. oil cooler", hasPosition: true },
            { id: 18, label: "Forward gland lub. oil cooler", hasPosition: true },
            { id: 19, label: "Lub Oil Transfer Pump", hasPosition: true }
        ]
    },
    9: {
        sectionId: "cooling_system",
        sectionName: "Cooling System",
        rows: [
            { id: 1, label: "Cooling system", hasPosition: false },
            { id: 2, label: "Main sea water cooling pump", hasPosition: true },
            { id: 3, label: "Aux. sea water cooling pump", hasPosition: true },
            { id: 4, label: "Harbour sea water cooling pump", hasPosition: true },
            { id: 5, label: "Aux. condenser sea water cooling pump", hasPosition: true },
            { id: 6, label: "Main engine fresh water cooling pump", hasPosition: true },
            { id: 7, label: "Piston cooling fresh water pump", hasPosition: true },
            { id: 8, label: "Fuel valve cooling pump", hasPosition: true },
            { id: 9, label: "Aux. engine fresh water cooling pump", hasPosition: true },
            { id: 10, label: "Main engine fresh water cooler", hasPosition: true },
            { id: 11, label: "Main engine piston fresh water cooler", hasPosition: true },
            { id: 12, label: "Aux. engine fresh water cooler", hasPosition: true },
            { id: 13, label: "Fuel valve fresh water cooler", hasPosition: true },
            { id: 14, label: "Main engine jacket cooling system fresh water heater", hasPosition: true },
            { id: 15, label: "Sea Water/Pipes/Valves/Filters", hasPosition: true },
            { id: 16, label: "Fresh Water/Pipes/Valves/Filters", hasPosition: true }
        ]
    },
    10: {
        sectionId: "condensate_system",
        sectionName: "Condensate System",
        rows: [
            { id: 1, label: "Condensate system", hasPosition: false },
            { id: 2, label: "Main steam condenser", hasPosition: true },
            { id: 3, label: "Aux. steam condenser", hasPosition: true },
            { id: 4, label: "Atmospheric condenser", hasPosition: true },
            { id: 5, label: "Dump condenser", hasPosition: true },
            { id: 6, label: "O.F. and lub. oil drain cooler", hasPosition: true },
            { id: 7, label: "Cargo oil tank drain cooler", hasPosition: true },
            { id: 8, label: "Condensate cooler", hasPosition: true },
            { id: 9, label: "Main condensate extraction pump", hasPosition: true },
            { id: 10, label: "Aux. condensate extraction pump", hasPosition: true },
            { id: 11, label: "Main condenser air ejector", hasPosition: true },
            { id: 12, label: "Aux. condenser air ejector", hasPosition: true }
        ]
    },
    11: {
        sectionId: "feed_water_system",
        sectionName: "Feed Water System",
        rows: [
            { id: 1, label: "Feed water system", hasPosition: false },
            { id: 2, label: "Main boiler, turbine driven feed pump", hasPosition: true },
            { id: 3, label: "Main boiler, electric driven feed pump", hasPosition: true },
            { id: 4, label: "Primary boiler feed pump", hasPosition: true },
            { id: 5, label: "Secondary boiler feed pump", hasPosition: true },
            { id: 6, label: "Auxiliary boiler feed pump", hasPosition: true },
            { id: 7, label: "Exhaust gas boiler feed pump", hasPosition: true },
            { id: 8, label: "Exhaust gas boiler economiser circ. pump", hasPosition: true },
            { id: 9, label: "Feed water transfer pump", hasPosition: true },
            { id: 10, label: "Feed water heater, main boiler", hasPosition: true },
            { id: 11, label: "Feed water heater, aux. boiler", hasPosition: true },
            { id: 12, label: "Feed Water/Pipes/Valves/Filters", hasPosition: true }
        ]
    },
    12: {
        sectionId: "boiler_steam_system",
        sectionName: "Boiler and Steam System",
        rows: [
            { id: 1, label: "Boiler and steam system", hasPosition: false },
            { id: 2, label: "Boiler forced draught fan and prime mover", hasPosition: true },
            { id: 3, label: "Boiler steam air heater", hasPosition: true },
            { id: 4, label: "Superheater", hasPosition: true },
            { id: 5, label: "De-superheater", hasPosition: true }
        ]
    },
    13: {
        sectionId: "hydraulic_system",
        sectionName: "Hydraulic System",
        rows: [
            { id: 1, label: "Hydraulic system", hasPosition: false },
            { id: 2, label: "Hydraulic pump/servo unit for control pitch propeller", hasPosition: true },
            { id: 3, label: "Circulating pump for pitch propeller system", hasPosition: true },
            { id: 4, label: "Cooler for pitch propeller system", hasPosition: true },
            { id: 5, label: "Pump for coupling", hasPosition: true },
            { id: 6, label: "Pump for remote control system", hasPosition: true },
            { id: 7, label: "Hydraulic pump for anchor handling tug winch", hasPosition: true },
            { id: 8, label: "Cooler for bow thruster system", hasPosition: true },
            { id: 9, label: "Hydraulic pump, relief devices and system for thruster unit", hasPosition: true },
            { id: 10, label: "Hydraulic pump and relief devices for hyd. windlass machy. unit", hasPosition: true },
            { id: 11, label: "Hydraulic module inclusive of pumps, piping etc.", hasPosition: true }
        ]
    },
    14: {
        sectionId: "bilge_ballast_system",
        sectionName: "Bilge and Ballast System",
        rows: [
            { id: 1, label: "Bilge and ballast system", hasPosition: false },
            { id: 2, label: "Reciprocating bilge pump", hasPosition: true },
            { id: 3, label: "Centrifugal bilge pump", hasPosition: true },
            { id: 4, label: "Central priming pump", hasPosition: true },
            { id: 5, label: "Bilge/ballast/fire pump", hasPosition: true },
            { id: 6, label: "Bilge/G.S. pump", hasPosition: true },
            { id: 7, label: "Fire pump", hasPosition: true },
            { id: 8, label: "Oily water separator bilge pump", hasPosition: true },
            { id: 9, label: "Emergency bilge pump", hasPosition: true },
            { id: 10, label: "Ballast pump", hasPosition: true },
            { id: 11, label: "Emergency fire pump and prime mover", hasPosition: true },
            { id: 12, label: "Bilge Ejector", hasPosition: true },
            { id: 13, label: "Working test of bilge system including Emergency suction", hasPosition: true },
            { id: 14, label: "Ballast Pipes/valves/Filters", hasPosition: true },
            { id: 15, label: "Bilge Pipes/Valves/Filters", hasPosition: true }
        ]
    },
    15: {
        sectionId: "unattended_machinery_space",
        sectionName: "Unattended Machinery Space",
        rows: [
            { id: 1, label: "Bridge Control", hasPosition: false },
            { id: 2, label: "Main Control Station", hasPosition: false },
            { id: 3, label: "Bilge Level Alarms", hasPosition: false },
            { id: 4, label: "Local Manual Controls", hasPosition: false },
            { id: 5, label: "Fire Detection and Prevention", hasPosition: false },
            { id: 6, label: "Alarm System Warning and Shut-offs", hasPosition: false },
            { id: 7, label: "Electric Supply", hasPosition: false }
        ]
    },
    16: {
        sectionId: "independent_tanks",
        sectionName: "Independent Tanks",
        rows: [
            { id: 1, label: "Tanks which are self-supporting, do not form part of the ship's hull or contribute to the hull strength.", hasPosition: false }
        ]
    },
    17: {
        sectionId: "electrical_system",
        sectionName: "Electrical System",
        rows: [
            { id: 1, label: "Gen. and governor running test", hasPosition: false },
            { id: 2, label: "Switch boards and fittings", hasPosition: true },
            { id: 3, label: "Emerg. source of power and associated equip.", hasPosition: false },
            { id: 4, label: "Navigating lights, indicators", hasPosition: false },
            { id: 5, label: "Cables/expansion boxes/fittings etc.", hasPosition: false },
            { id: 6, label: "Circuit breakers", hasPosition: false },
            { id: 7, label: "Motor/s, control/s and starter/s", hasPosition: false },
            { id: 8, label: "Transformer/s", hasPosition: false },
            { id: 9, label: "Megger test", hasPosition: false },
            { id: 10, label: "Shaft Generator", hasPosition: false }
        ]
    },
    18: {
        sectionId: "electrical_system",
        sectionName: "Electrical System",
        rows: [
            { id: 1, label: "Electrical system", hasPosition: false },
            { id: 2, label: "Gen. and governor running test", hasPosition: true },
            { id: 3, label: "Switch boards and fittings", hasPosition: true },
            { id: 4, label: "Emerg. source of power and associated equip.", hasPosition: false },
            { id: 5, label: "Navigating lights, indicators", hasPosition: false },
            { id: 6, label: "Cables/expansion boxes/fittings etc.", hasPosition: false },
            { id: 7, label: "Circuit breakers", hasPosition: false },
            { id: 8, label: "Motor/s, control/s and starter/s", hasPosition: false },
            { id: 9, label: "Transformer/s", hasPosition: false },
            { id: 10, label: "Megger test", hasPosition: false },
            { id: 11, label: "Shaft Generator", hasPosition: false }
        ]
    },
    19: {
        sectionId: "instrumentation_automation",
        sectionName: "Instrumentation and Automation Equipment",
        rows: [
            { id: 1, label: "Control system for main engine", hasPosition: false },
            { id: 2, label: "Control system for bow/side thruster", hasPosition: true },
            { id: 3, label: "Control system for control pitch propeller", hasPosition: true },
            { id: 4, label: "Boiler front oil burning unit", hasPosition: false }
        ]
    },
    20: {
        sectionId: "inert_gas_system",
        sectionName: "Inert Gas System",
        rows: [
            { id: 1, label: "Inert gas system", hasPosition: false },
            { id: 1, label: "Blowers", hasPosition: true },
            { id: 2, label: "Gas Scrubber Unit", hasPosition: true },
            { id: 3, label: "Deck Water Seal and Piping", hasPosition: false },
            { id: 4, label: "Gas Isolating Valves and Interlock Devices", hasPosition: false },
            { id: 5, label: "Gas Piping,Valves and Vent System", hasPosition: false },
            { id: 6, label: "Pressure Vacuum Devices", hasPosition: false },
            { id: 7, label: "Alarms and Shutdown Systems", hasPosition: false },
            { id: 8, label: "Scrubber Cooling Pump", hasPosition: true },
            { id: 9, label: "Scrubber Effluent Discharge pipe and Valves", hasPosition: false }
        ]
    },
    21: {
        sectionId: "sea_connections",
        sectionName: "Sea Connections",
        rows: [
            { id: 1, label: "Sea connections", hasPosition: false }
        ]
    },
    22: {
        sectionId: "thrusters",
        sectionName: "Bow and Aft Thruster",
        rows: [
            { id: 1, label: "Bow thruster/s", hasPosition: false },
            { id: 2, label: "Bow thruster propeller", hasPosition: true },
            { id: 3, label: "Bow thruster driving Machinery unit", hasPosition: true },
            { id: 4, label: "Aft thruster propeller", hasPosition: true },
            { id: 5, label: "Aft Thruster Driving Machinery Unit", hasPosition: true }
        ]
    },
    23: {
        sectionId: "tailshaft_survey",
        sectionName: "Tailshaft Survey",
        rows: [
            { id: 1, label: "Tailshaft Survey", hasPosition: true },
            { id: 2, label: "Oil Lubricated/Continuous Liner/Non Corrosive", hasPosition: true },
            { id: 3, label: "Crack detection of Screw Shaft Cone", hasPosition: true },
            { id: 4, label: "Approved Oil Gland", hasPosition: true },
            { id: 5, label: "Propeller", hasPosition: true },
            { id: 6, label: "Tailshaft", hasPosition: true },
            { id: 7, label: "Stern Bush & Bearing", hasPosition: true }
        ]
    },
    24: {
        sectionId: "waterjet_propulsion",
        sectionName: "Waterjet Propulsion",
        rows: [
            { id: 1, label: "Waterjet Propulsion", hasPosition: true },
            { id: 2, label: "Impeller", hasPosition: true },
            { id: 3, label: "Impeller Shaft", hasPosition: true },
            { id: 4, label: "Shaft Journal", hasPosition: true },
            { id: 5, label: "Impeller Chamber", hasPosition: true }
        ]
    },
    25: {
        sectionId: "directional_propulsion",
        sectionName: "Directional Propulsion",
        rows: [
            { id: 1, label: "Directional propulsion", hasPosition: true },
            { id: 2, label: "Blades/Propeller", hasPosition: true },
            { id: 3, label: "Control Linkages/Pitch Indicator", hasPosition: true },
            { id: 4, label: "Hydraulic Unit", hasPosition: true },
            { id: 5, label: "Drive Shaft/Coupling/Cardan Shaft/Clutch Assembly", hasPosition: true },
            { id: 6, label: "Oil cooler and piping", hasPosition: true },
            { id: 7, label: "Steering System/Gear Assembly", hasPosition: true },
            { id: 8, label: "Foundation structure/Tightness of Principal Assemblies", hasPosition: true }
        ]
    },
    26: {
        sectionId: "main_aux_boiler",
        sectionName: "Main Boiler / Aux. Oil Fired Boiler / Composite Aux Boiler",
        rows: [
            { id: 1, label: "Main Boiler / Aux. Oil Fired Boiler / Composite Aux Boiler", hasPosition: true },
            { id: 2, label: "Int Examination including Fit of Doors", hasPosition: false },
            { id: 3, label: "External Examination including Fire Side & Securing Arrangement", hasPosition: false },
            { id: 4, label: "Steam Stop Valves", hasPosition: false },
            { id: 5, label: "Safety Valves and Mountings Except Steam Stop Valves", hasPosition: false },
            { id: 6, label: "Adjustment of Safety Valve, O.F. Burning & Remote Control", hasPosition: false }
        ]
    },
    27: {
        sectionId: "exhaust_gas_boiler",
        sectionName: "Exhaust Gas Boiler / Economiser",
        rows: [
            { id: 1, label: "Internal and External Examination including Mountings", hasPosition: true },
            { id: 2, label: "Adjustment of Safety Valve", hasPosition: false }
        ]
    },
    28: {
        sectionId: "thermal_oil_heater",
        sectionName: "Thermal Oil Heater",
        rows: [
            { id: 1, label: "Thermal Oil Heater", hasPosition: true },
            { id: 2, label: "Int Examination of Furnace", hasPosition: false },
            { id: 3, label: "External Examination including Securing Arrangement", hasPosition: false },
            { id: 4, label: "Burner Unit", hasPosition: false },
            { id: 5, label: "Safety Devices", hasPosition: false },
            { id: 6, label: "Oil Piping", hasPosition: false }
        ]
    },
    29: {
        sectionId: "steam_pipes",
        sectionName: "Steam Pipes (for pipes over 75 mm NB)",
        rows: [
            { id: 1, label: "Steam pipes (for pipes over 75 mm NB)", hasPosition: false }
        ]
    },
    30: {
        sectionId: "refrigerated_cargo_system",
        sectionName: "Refrigerated Cargo System",
        rows: [
            { id: 1, label: "Refrigerated Cargo system", hasPosition: true },
            { id: 2, label: "Cargo tank insulation & vapour seal", hasPosition: false },
            { id: 3, label: "Vent Stack Drain Tank", hasPosition: false },
            { id: 4, label: "Reciprocating compressor", hasPosition: false },
            { id: 5, label: "Gas Tight Bulkhead Glands", hasPosition: false },
            { id: 6, label: "Cargo Condenser (Examination)", hasPosition: false },
            { id: 7, label: "Cargo Condenser (Pressure test)", hasPosition: false },
            { id: 8, label: "Suction Separator", hasPosition: false },
            { id: 9, label: "Pressure Relief Valves", hasPosition: false },
            { id: 10, label: "Sea Water Circulating Pump", hasPosition: false },
            { id: 11, label: "Glycol Circulating pump", hasPosition: false },
            { id: 12, label: "Inter Stage Cooler for Cargo Compressor", hasPosition: false },
            { id: 13, label: "Cargo Heater for Booster pump", hasPosition: false },
            { id: 14, label: "Fresh Water/Glycol Heat Exchanger", hasPosition: false },
            { id: 15, label: "Automatic Controls & Alarms", hasPosition: false },
            { id: 16, label: "Electrical Insulation", hasPosition: false },
            { id: 17, label: "Intermediate cooler", hasPosition: false }
        ]
    }
};

const HULL_SECTIONS = {
    1: {
        sectionId: "thickness_measurement",
        sectionName: "Thickness Measurement",
        rows: [
            { id: 1, label: "Thickness measurement", hasPosition: false, isDue: false, isFrom: false }
        ]
    }
    ,
    2: {
        sectionId: "superstructures",
        sectionName: "Superstructures",
        rows: [
            { id: 1, label: "Superstructures", hasPosition: false, isDue: false, isFrom: false },
            { id: 1, label: "Forecastle", hasPosition: false, isDue: false, isFrom: false },
            { id: 2, label: "Raised fore deck", hasPosition: false, isDue: false, isFrom: false },
            { id: 3, label: "Bridge superstructure", hasPosition: false, isDue: false, isFrom: false },
            { id: 4, label: "Raised quarter deck", hasPosition: false, isDue: false, isFrom: false },
            { id: 5, label: "Poop", hasPosition: false, isDue: false, isFrom: false }
        ]
    },
    3: {
        sectionId: "weather_superstructure_deck",
        sectionName: "Exposed Weather Deck and Superstructure Deck Plating",
        rows: [
            { id: 1, label: "Exposed weather deck and superstructure deck plating", hasPosition: false, isDue: false, isFrom: false },
            { id: 2, label: "Upper deck plating", hasPosition: false, isDue: false, isFrom: false },
            { id: 3, label: "Forecastle deck plating", hasPosition: false, isDue: false, isFrom: false },
            { id: 4, label: "Raised fore deck plating", hasPosition: false, isDue: false, isFrom: false },
            { id: 5, label: "Bridge deck plating", hasPosition: false, isDue: false, isFrom: false },
            { id: 6, label: "Raised quarter deck plating", hasPosition: false, isDue: false, isFrom: false },
            { id: 7, label: "Poop deck plating", hasPosition: false },
            { id: 8, label: "Deckhouse", hasPosition: false }
        ]
    },
    4: {
        sectionId: "spaces_forecastle_poops",
        sectionName: "Spaces in Forecastle and Poop",
        rows: [
            { id: 1, label: "Forecastle tween deck space/s", hasPosition: false, isDue: false, isFrom: false },
            { id: 2, label: "Poop tween deck space/s", hasPosition: false, isDue: false, isFrom: false }
        ]
    },
    5: {
        sectionId: "spaces_peak_tanks_stores",
        sectionName: "Spaces Above Fore and Aft Peak Tanks; Stores and Accommodation Spaces",
        rows: [
            { id: 1, label: "Spaces above fore and aft peak tanks; stores and accommodation spaces", hasPosition: false, isDue: false, isFrom: false },
            { id: 2, label: "Fore peak Deck space/s", hasPosition: true, isDue: false, isFrom: false },
            { id: 3, label: "Aft peak Deck space/s", hasPosition: true, isDue: false, isFrom: false },
            { id: 4, label: "Accommodation space/s", hasPosition: true, isDue: false, isFrom: false },
            { id: 5, label: "Store space/s", hasPosition: true, isDue: false, isFrom: false }
        ]
    },
    6: {
        sectionId: "engine_pump_boiler_spaces",
        sectionName: "Engine room, pump room and boiler spaces",
        rows: [
            { id: 1, label: "Engine room, pump room and boiler spaces", hasPosition: false, isDue: false, isFrom: false },
            { id: 2, label: "Engine room", hasPosition: true, isDue: false, isFrom: false },
            { id: 3, label: "Pump room", hasPosition: true, isDue: false, isFrom: false },
            { id: 4, label: "Boiler room", hasPosition: true, isDue: false, isFrom: false },
            { id: 5, label: "Chain locke", hasPosition: true, isDue: false, isFrom: false }
        ]
    },
    7: {
        sectionId: "holds_tween_decks",
        sectionName: "Holds and Tween decks (excluding tankers)",
        rows: [
            { id: 1, label: "Holds and Tween decks (excluding tankers)", hasPosition: false, isDue: false, isFrom: false },
            { id: 2, label: "No.1 Hold", hasPosition: true, isDue: false, isFrom: false },
            { id: 3, label: "No.2 Hold", hasPosition: true, isDue: false, isFrom: false },
            { id: 4, label: "No.3 Hold", hasPosition: true, isDue: false, isFrom: false },
            { id: 5, label: "No.4 Hold", hasPosition: true, isDue: false, isFrom: false },
            { id: 6, label: "No.5 Hold", hasPosition: true, isDue: false, isFrom: false },
            { id: 7, label: "No.6 Hold", hasPosition: true, isDue: false, isFrom: false },
            { id: 8, label: "No.7 Hold", hasPosition: true, isDue: false, isFrom: false },
            { id: 9, label: "No.8 Hold", hasPosition: true, isDue: false, isFrom: false },
            { id: 10, label: "Hold/WB Tank", hasPosition: true, isDue: false, isFrom: false },
            { id: 11, label: "Hold/Cargo oil tank", hasPosition: true, isDue: false, isFrom: false },
            { id: 12, label: "Cargo oil tank/s", hasPosition: true, isDue: false, isFrom: false }
        ]
    },
    8: {
        sectionId: "tween_decks",
        sectionName: "Tween Deck/s",
        rows: [
            { id: 1, label: "Upper tween deck space", hasPosition: true, isDue: false, isFrom: false },
            { id: 2, label: "Lower tween deck space", hasPosition: true, isDue: false, isFrom: false }
        ]
    },
    9: {
        sectionId: "cargo_tanks_tankers",
        sectionName: "Cargo tanks for tankers only",
        rows: [
            { id: 1, label: "Cargo tanks for tankers only", hasPosition: false, isDue: false, isFrom: false },
            { id: 2, label: "No.1 Cargo tank", hasPosition: true, isDue: false, isFrom: false },
            { id: 3, label: "No.2 Cargo tank", hasPosition: true, isDue: false, isFrom: false },
            { id: 4, label: "No.3 Cargo tank", hasPosition: true, isDue: false, isFrom: false },
            { id: 5, label: "No.4 Cargo tank", hasPosition: true, isDue: false, isFrom: false },
            { id: 6, label: "No.5 Cargo tank", hasPosition: true, isDue: false, isFrom: false },
            { id: 7, label: "No.6 Cargo tank", hasPosition: true, isDue: false, isFrom: false },
            { id: 8, label: "No.7 Cargo tank", hasPosition: true, isDue: false, isFrom: false },
            { id: 9, label: "No.8 Cargo tank", hasPosition: true, isDue: false, isFrom: false },
            { id: 10, label: "No.9 Cargo tank", hasPosition: true, isDue: false, isFrom: false }
        ]
    },
    41: {
        "sectionId": "slop_tanks",
        "sectionName": "Slop tank/s",
        "rows": [
            {
                "id": 1,
                "label": "Slop tank/s",
                "hasPosition": false,
                "isDue": true,
                "isFrom": true
            },
            {
                "id": 2,
                "label": "Slop tank",
                "hasPosition": false,
                "isDue": true,
                "isFrom": true
            },
            {
                "id": 3,
                "label": "Slop tank",
                "hasPosition": true,
                "isDue": true,
                "isFrom": true
            }
        ]
    },

    10: {
        "sectionId": "dry_tanks_void_spaces",
        "sectionName": "Dry tanks/void spaces",
        "rows": [
            {
                "id": 1,
                "label": "Dry tanks/void spaces",
                "hasPosition": true,
                "isDue": false,
                "isFrom": false
            }
        ]
    },
    11: {
        "sectionId": "peak_tanks",
        "sectionName": "Peak tanks",
        "rows": [
            {
                "id": 1,
                "label": "Peak tanks",
                "hasPosition": false,
                "isDue": false,
                "isFrom": false
            },
            {
                "id": 2,
                "label": "Forepeak Tank",
                "hasPosition": true,
                "isDue": true,
                "isFrom": true
            },
            {
                "id": 3,
                "label": "Aft Peak Tank",
                "hasPosition": true,
                "isDue": true,
                "isFrom": true
            }
        ]
    },
    12: {
        "sectionId": "cargo_tanks_tankers",
        "sectionName": "W.B & Storage tank/s",
        "rows": [
            {
                "id": 1,
                "label": "W.B & Storage tank/s in the following order: side tanks; topside tanks; deep tanks; double bottom tanks; other engine room tanks (excluding independent tanks); other tanks not intended for carriage of cargo",
                "hasPosition": false,
                "isDue": false,
                "isFrom": false
            }
        ]
    },
    13: {
        "sectionId": "cargo_tanks_tankers",
        "sectionName": "Duct keels/Cofferdams/Stool spaces (for Bulk carriers)",
        "rows": [
            {
                "id": 1,
                "label": "Duct keels/Cofferdams/Stool spaces (for Bulk carriers)",
                "hasPosition": true,
                "isDue": true,
                "isFrom": true
            },
            {
                "id": 2,
                "label": "Aft Transverse Bulkhead Upper Stool Space",
                "hasPosition": true,
                "isDue": true,
                "isFrom": true
            },
            {
                "id": 3,
                "label": "Aft Transverse Bulkhead Lower Stool Space",
                "hasPosition": true,
                "isDue": true,
                "isFrom": true
            }
        ]
    },
    14: {
        "sectionId": "tunnels",
        "sectionName": "Tunnel/s",
        "rows": [
            {
                "id": 1,
                "label": "Tunnel/s",
                "hasPosition": false,
                "isDue": false,
                "isFrom": false
            },
            {
                "id": 2,
                "label": "Shaft tunnel",
                "hasPosition": true,
                "isDue": false,
                "isFrom": false
            },
            {
                "id": 3,
                "label": "Tunnel well",
                "hasPosition": true,
                "isDue": false,
                "isFrom": false
            },
            {
                "id": 4,
                "label": "Under deck tunnel",
                "hasPosition": true,
                "isDue": false,
                "isFrom": false
            }
        ]
    },
    15: {
        "sectionId": "under_engine_boiler",
        "sectionName": "Under engine/s/boiler/s",
        "rows": [
            {
                "id": 1,
                "label": "Under engine/s/boiler/s",
                "hasPosition": false,
                "isDue": false,
                "isFrom": false
            },
            {
                "id": 2,
                "label": "Under engines",
                "hasPosition": false,
                "isDue": false,
                "isFrom": false
            },
            {
                "id": 3,
                "label": "Under boilers",
                "hasPosition": false,
                "isDue": false,
                "isFrom": false
            }
        ]
    },
    16: {
        "sectionId": "misc_compartments",
        "sectionName": "Misc. compartments",
        "rows": [
            {
                "id": 1,
                "label": "Misc. compartments",
                "hasPosition": true,
                "isDue": false,
                "isFrom": false
            },
            {
                "id": 2,
                "label": "Echo sounding compartment",
                "hasPosition": true,
                "isDue": false,
                "isFrom": false
            },
            {
                "id": 3,
                "label": "Steering gear compartment",
                "hasPosition": true,
                "isDue": false,
                "isFrom": false
            },
            {
                "id": 4,
                "label": "Bow thrust compartment",
                "hasPosition": true,
                "isDue": false,
                "isFrom": false
            },
            {
                "id": 5,
                "label": "Emergency Fire Pump Compartment",
                "hasPosition": true,
                "isDue": false,
                "isFrom": false
            },
            {
                "id": 6,
                "label": "Paint Locker",
                "hasPosition": true,
                "isDue": false,
                "isFrom": false
            }
        ]
    },
    17: {
        "sectionId": "cargo_tanks_tankers",
        "sectionName": "Misc. items",
        "rows": [
            { "id": 1, "label": "Misc. items", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 2, "label": "Windlass", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 3, "label": "Anchor/s", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 4, "label": "Cable/s", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 5, "label": "Steering gear", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 6, "label": "Aux. steering gear", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 7, "label": "Hand pump/s", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 8, "label": "Sounding pipes", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 9, "label": "Air pipe/s and closing appliances", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 10, "label": "Mast/s", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 11, "label": "Rigging", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 12, "label": "Fire equipment", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 13, "label": "Means of escape", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 14, "label": "Communication – Steering gear related", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 15, "label": "Helm indicator", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 16, "label": "Watertight door/s", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 17, "label": "Hatchways and closing appliances", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 18, "label": "Ventilators and closing appliances", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 19, "label": "Casings and their closing appliances", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 20, "label": "Skylights and closing appliances", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 21, "label": "Deckhouses, companionways and closing appliances", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 22, "label": "Superstructures and closing appliances", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 23, "label": "Side, bow, stern doors and closing appliances", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 24, "label": "Windows, side scuttles, deadlights and closing appliances", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 25, "label": "Refuse chutes etc. and closing appliances", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 26, "label": "Scuppers, sanitary discharges and valves", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 27, "label": "Guard rails and bulwarks", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 28, "label": "Freeing ports", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 29, "label": "Gangways, walkways and lifelines", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 30, "label": "Fittings for timber deck cargo", "hasPosition": false, "isDue": false, "isFrom": false },
            { "id": 31, "label": "Towing Hook/Winch and Associated under deck structures", "hasPosition": true, "isDue": false, "isFrom": false },
            { "id": 32, "label": "Emergency Towing Arrangement", "hasPosition": true, "isDue": false, "isFrom": false },
            { "id": 33, "label": "Safe Access to Tanker Bow", "hasPosition": false, "isDue": false, "isFrom": false }
        ]
    }









};

const MachineryHullManager = () => {
    const [tabValue, setTabValue] = useState(0);
    const [formData, setFormData] = useState({});
    const [shipType, setShipType] = useState();
    const [noOfCylinders, setNoOfCylinders] = useState();
    const [selectedShip, setSelectedShip] = useState({ id: "", shipName: "" });
    const [position, setPosition] = useState([]);
    const [clientsList, setClientsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    let isDue = false;
    let isFrom = false;
    const ITEMS_PER_PAGE = 5;
    const [dynamicRows, setDynamicRows] = useState({ machinery: {}, hull: {} });

    const calculateDueDate = (assignmentDate) => {
        if (!assignmentDate) return "";
        const date = new Date(assignmentDate);
        date.setFullYear(date.getFullYear() + 5);
        return date.toISOString().split('T')[0];
    };

    const updateField = (sectionType, sectionNum, rowId, key, value) => {
        const fieldKey = `${sectionType}-${sectionNum}-${rowId}`;

        setFormData((prev) => {
            const updated = {
                ...prev,
                [fieldKey]: {
                    ...prev[fieldKey],
                    [key]: value,
                },
            };

            if (key === "assignmentDate" && value) {
                updated[fieldKey].dueDate = calculateDueDate(value);
            }

            return updated;
        });
    };

    const handleAddRow = (sectionType, sectionNum) => {
        setDynamicRows(prev => {
            const currentSections = sectionType === 'machinery' ? MACHINERY_SECTIONS : HULL_SECTIONS;
            const section = currentSections[sectionNum];
            const currentDynamicRows = prev[sectionType][sectionNum] || [];

            const existingIds = [
                ...section.rows.map(r => r.id),
                ...currentDynamicRows.map(r => r.id)
            ];
            const nextId = Math.max(...existingIds, 0) + 1;

            const newRow = {
                id: nextId,
                label: "",
                hasPosition: true,
            };

            return {
                ...prev,
                [sectionType]: {
                    ...prev[sectionType],
                    [sectionNum]: [...currentDynamicRows, newRow]
                }
            };
        });
    };

    const fetchClients = async () => {
        try {
            setLoading(true);
            const result = await getAllClients();
            if (result?.status === 200) {
                setClientsList(result.data.data);
            } else {
                toast.error(result?.message);
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            toast.error(error?.message || "Failed to fetch clients");
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleClientChange = (event) => {
        const selectedId = event.target.value;
        const selectedClient = clientsList.find((client) => client.id === selectedId);
        setSelectedShip({
            id: selectedId,
            shipName: selectedClient ? selectedClient.shipName : "",
        });
    };

    const generatePayload = () => {
        const currentSections = tabValue === 0 ? MACHINERY_SECTIONS : HULL_SECTIONS;
        const sectionType = tabValue === 0 ? 'machinery' : 'hull';

        const payload = {
            shipId: selectedShip.id,
            shipName: selectedShip.shipName,
            engineType: shipType,
            numberOfCylinders: noOfCylinders,
            globalPosition: position,
            type: sectionType,
            sections: {}
        };

        Object.keys(currentSections).forEach(sectionNum => {
            const section = currentSections[sectionNum];
            const dynamicRowsForSection = dynamicRows[sectionType][sectionNum] || [];
            const allRows = [...section.rows, ...dynamicRowsForSection];

            const sectionData = allRows
                .filter(row => {
                    const fieldKey = `${sectionType}-${sectionNum}-${row.id}`;
                    return formData[fieldKey]?.xMark === "X";
                })
                .map(row => {
                    const fieldKey = `${sectionType}-${sectionNum}-${row.id}`;
                    const data = formData[fieldKey] || {};
                    return {
                        rowId: row.id,
                        label: data.label || row.label,
                        position: data.position || [],
                        from: data.from || null,
                        to: data.to || null,
                        assignmentDate: data.assignmentDate || null,
                        dueDate: data.dueDate || null,
                        postponedDate: data.postponedDate || null,
                    };
                });

            if (sectionData.length > 0) {
                payload.sections[section.sectionId] = {
                    sectionNumber: parseInt(sectionNum),
                    sectionName: section.sectionName,
                    items: sectionData
                };
            }
        });

        return payload;
    };

    const handleSubmit = () => {
        const payload = generatePayload();
        console.log("Payload:", JSON.stringify(payload, null, 2));
        alert("Payload generated! Check console for details.");
    };

    const renderRow = (row, sectionType, sectionNum) => {
        const fieldKey = `${sectionType}-${sectionNum}-${row.id}`;
        const isChecked = formData[fieldKey]?.xMark === "X";

        return (
            <Grid2 key={`${fieldKey}`} xs={12} mt={2}>
                <Grid2 container spacing={2} alignItems="center">
                    <Grid2 size={{ xs: 12, md: 0.6 }}>
                        <Checkbox
                            checked={isChecked}
                            onChange={(e) =>
                                updateField(sectionType, sectionNum, row.id, "xMark", e.target.checked ? "X" : "-")
                            }
                        />
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 3.3 }}>
                        {row.label ? (
                            <Typography fontWeight={600}>{row.label}</Typography>
                        ) : (
                            <TextField
                                variant="standard"
                                size="small"
                                fullWidth
                                disabled={!isChecked}
                                value={formData[fieldKey]?.label || ""}
                                onChange={(e) => updateField(sectionType, sectionNum, row.id, "label", e.target.value)}
                                placeholder="Enter label"
                            />
                        )}
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 2 }}>
                        {row.hasPosition ? (
                            <Select
                                multiple
                                variant="standard"
                                fullWidth
                                size="small"
                                displayEmpty
                                disabled={!isChecked}
                                value={formData[fieldKey]?.position || []}
                                onChange={(e) => updateField(sectionType, sectionNum, row.id, "position", e.target.value)}
                                renderValue={(selected) => selected.join("")}
                            >
                                {POSITION_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.code} value={opt.code}>
                                        <Checkbox checked={(formData[fieldKey]?.position || []).includes(opt.code)} />
                                        <Typography>{opt.name} ({opt.code})</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        ) : row.hasFromTo ? (
                            <Grid2 container spacing={1} alignItems="center">
                                <Grid2 size={{ xs: 12, md: 5 }}>
                                    <TextField
                                        variant="standard"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        disabled={!isChecked}
                                        value={formData[fieldKey]?.from || ""}
                                        onChange={(e) => updateField(sectionType, sectionNum, row.id, "from", e.target.value)}
                                    />
                                </Grid2>
                                <Grid2 size={{ xs: 12, md: 2 }}>
                                    <Typography>To</Typography>
                                </Grid2>
                                <Grid2 size={{ xs: 12, md: 5 }}>
                                    <TextField
                                        variant="standard"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        disabled={!isChecked}
                                        value={formData[fieldKey]?.to || ""}
                                        onChange={(e) => updateField(sectionType, sectionNum, row.id, "to", e.target.value)}
                                    />
                                </Grid2>
                            </Grid2>
                        ) : (
                            <Box sx={{ height: "40px" }} />
                        )}
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 2 }}>
                        <TextField
                            type="date"
                            size="small"
                            fullWidth
                            variant="standard"
                            label="Assignment Date"
                            disabled={!isChecked}
                            InputLabelProps={{ shrink: true }}
                            value={formData[fieldKey]?.assignmentDate || ""}
                            onChange={(e) => updateField(sectionType, sectionNum, row.id, "assignmentDate", e.target.value)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2 }}>
                        {row.isDue ? (
                            <TextField
                                type="date"
                                size="small"
                                variant="standard"
                                fullWidth
                                label="Due Date"
                                disabled={!isChecked}
                                InputLabelProps={{ shrink: true }}
                                value={formData[fieldKey]?.dueDate || ""}
                                onChange={(e) => updateField(sectionType, sectionNum, row.id, "dueDate", e.target.value)}
                            />) : (
                            <TextField
                                variant="standard"
                                type="date"
                                size="small"
                                fullWidth
                                label="From Frame no"
                                disabled={!isChecked}
                                InputLabelProps={{ shrink: true }}
                                value={formData[fieldKey]?.postponedDate || ""}
                                onChange={(e) => updateField(sectionType, sectionNum, row.id, "postponedDate", e.target.value)}
                            />
                        )}
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 2 }}>
                        {row.isDue ? (
                            // Case 1: isDue = true → show Postponed Date
                            <TextField
                                variant="standard"
                                type="date"
                                size="small"
                                fullWidth
                                label="Postponed Date"
                                disabled={!isChecked}
                                InputLabelProps={{ shrink: true }}
                                value={formData[fieldKey]?.postponedDate || ""}
                                onChange={(e) =>
                                    updateField(sectionType, sectionNum, row.id, "postponedDate", e.target.value)
                                }
                            />
                        ) : (
                            // Case 2: isDue = false + isFrom = true → Upto Frame no
                            <TextField
                                variant="standard"
                                type="date"
                                size="small"
                                fullWidth
                                label="Upto Frame No"
                                disabled={!isChecked}
                                InputLabelProps={{ shrink: true }}
                                value={formData[fieldKey]?.postponedDate || ""}
                                onChange={(e) =>
                                    updateField(sectionType, sectionNum, row.id, "postponedDate", e.target.value)
                                }
                            />
                        )
                        }
                    </Grid2>
                </Grid2>
            </Grid2>
        );
    };

    const renderSection = (sectionNum, section, sectionType) => {
        const dynamicRowsForSection = dynamicRows[sectionType][sectionNum] || [];
        const allRows = [...section.rows, ...dynamicRowsForSection];
        isDue = section.rows.some(r => r.isDue === true);
        isFrom = section.rows.some(r => r.isFrom === true);

        return (
            <Accordion key={sectionNum} sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontSize={18} fontWeight={600}>
                        {sectionNum}. {section.sectionName}
                    </Typography>
                </AccordionSummary>
                {section.sectionId === "machinery_list" && (
                    <>
                        <FormControl sx={{ p: 3 }}>
                            <Typography fontWeight={700} mb={1}>Engine Type</Typography>
                            <RadioGroup
                                row
                                value={shipType}
                                onChange={(e) => setShipType(e.target.value)}
                            >
                                <FormControlLabel value="crosshead" control={<Radio />} label="Crosshead Type Engine" />
                                <FormControlLabel value="inline" control={<Radio />} label="Inline Trunk Piston Engine" />
                                <FormControlLabel value="vee" control={<Radio />} label="Vee-Type Trunk Piston Engine" />
                            </RadioGroup>
                        </FormControl>

                        <Grid2 container spacing={2} sx={{ mb: 3 }}>
                            <Grid2 size={{ xs: 12, md: 4 }}>
                                <Typography fontWeight={700} mb={1} sx={{ ml: 3 }}>
                                    No. of cylinders in each engine/bank
                                </Typography>
                                <TextField
                                    sx={{ ml: 3 }}
                                    placeholder="Enter no of cylinders"
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    value={noOfCylinders}
                                    onChange={(e) => setNoOfCylinders(e.target.value)}
                                />
                            </Grid2>

                            <Grid2 size={{ xs: 12, md: 4, ml: 3 }}>
                                <Typography fontWeight={700} mb={1} sx={{ ml: 3 }}>Global Position</Typography>
                                <Select
                                    sx={{ ml: 3 }}
                                    multiple
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    displayEmpty
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    renderValue={(selected) => selected.join("")}
                                >
                                    {POSITION_OPTIONS.map((opt) => (
                                        <MenuItem key={opt.code} value={opt.code}>
                                            <Checkbox checked={position.includes(opt.code)} />
                                            <Typography>{opt.name} ({opt.code})</Typography>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Grid2>
                        </Grid2>
                    </>
                )}

                <AccordionDetails>
                    <Grid2 container spacing={2} alignItems="center" sx={{ mb: 2, fontWeight: 700 }}>
                        <Grid2 size={{ xs: 12, md: 0.6 }}></Grid2>
                        <Grid2 size={{ xs: 12, md: 3.3 }}>Description</Grid2>
                        <Grid2 size={{ xs: 12, md: 2 }}>Position / No.</Grid2>
                        <Grid2 size={{ xs: 12, md: 2 }}>Assignment Date</Grid2>
                        <Grid2 size={{ xs: 12, md: 2 }}>
                            {isDue
                                ? "Due date"

                                : "From Frame No."}
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 2 }}>{isDue === true ? "Postponed Date" : "Upto Frame no."}</Grid2>
                    </Grid2>

                    {allRows.map(row => renderRow(row, sectionType, sectionNum))}

                    <Box mt={3} textAlign="right">
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleAddRow(sectionType, sectionNum)}
                        >
                            + Add Row
                        </Button>
                    </Box>
                </AccordionDetails>
            </Accordion>
        );
    };
    const currentSections = tabValue === 0 ? MACHINERY_SECTIONS : HULL_SECTIONS;
    const sectionType = tabValue === 0 ? 'machinery' : 'hull';

    // Get section keys and calculate pagination
    const sectionKeys = Object.keys(currentSections);
    const totalPages = Math.ceil(sectionKeys.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedSectionKeys = sectionKeys.slice(startIndex, endIndex);

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };
    return (
        <Card sx={{ p: 3, mt: 2 }}>
            <FormControl fullWidth sx={{ maxWidth: 300 }}>
                <Typography sx={{ fontWeight: 700, mb: 2, ml: 2 }}>
                    Select Ship
                </Typography>
                <Select sx={{ ml: 2 }} value={selectedShip.id || ""} onChange={handleClientChange}>
                    <MenuItem value="">&nbsp;
                    </MenuItem>
                    {clientsList.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                            {client.shipName}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <CardContent>
                {/* <FormControl sx={{ mb: 3 }}>
                    <Typography fontWeight={700} mb={1}>Engine Type</Typography>
                    <RadioGroup
                        row
                        value={shipType}
                        onChange={(e) => setShipType(e.target.value)}
                    >
                        <FormControlLabel value="crosshead" control={<Radio />} label="Crosshead Type Engine" />
                        <FormControlLabel value="inline" control={<Radio />} label="Inline Trunk Piston Engine" />
                        <FormControlLabel value="vee" control={<Radio />} label="Vee-Type Trunk Piston Engine" />
                    </RadioGroup>
                </FormControl> */}
                {/* 
                <Grid2 container spacing={2} sx={{ mb: 3 }}>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                        <Typography fontWeight={700} mb={1}>
                            No. of cylinders in each engine/bank
                        </Typography>
                        <TextField
                            placeholder="Enter no of cylinders"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={noOfCylinders}
                            onChange={(e) => setNoOfCylinders(e.target.value)}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                        <Typography fontWeight={700} mb={1}>Global Position</Typography>
                        <Select
                            multiple
                            variant="outlined"
                            fullWidth
                            size="small"
                            displayEmpty
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            renderValue={(selected) => selected.join("")}
                        >
                            {POSITION_OPTIONS.map((opt) => (
                                <MenuItem key={opt.code} value={opt.code}>
                                    <Checkbox checked={position.includes(opt.code)} />
                                    <Typography>{opt.name} ({opt.code})</Typography>
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid2>
                </Grid2> */}

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                        <Tab label="Machinery" />
                        <Tab label="Hull" />
                    </Tabs>
                </Box>

                {/* Render Sections */}
                {paginatedSectionKeys.map(sectionNum =>
                    renderSection(sectionNum, currentSections[sectionNum], sectionType)
                )}

                {/* Pagination controls */}
                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination
                            count={totalPages}
                            page={currentPage}
                            onChange={handlePageChange}
                            color="primary"
                            size="large"
                        />
                    </Box>
                )}

                {/* Submit Button */}
                <Box mt={4} textAlign="end">
                    <CommonButton
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleSubmit}
                    >
                        Submit
                    </CommonButton>
                </Box>
            </CardContent>
        </Card>
    );
};

export default MachineryHullManager;
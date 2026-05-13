import { Factory, Configuration } from './types';

export function mapLayoutList(backendRows: any[]): Configuration[] {
  return backendRows.map(row => ({
    id: String(row.id || row.layout_version_id), // Use layout_version_id as the primary unique ID for the UI list
    version: row.version || row.version_name,
    name: row.name || row.layout_name,
    isActive: Boolean(row.isActive || row.is_current_version),
    status: row.status,
    adminComments: row.admin_comments,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.createdAt || row.imported_at,
    updatedAt: row.createdAt || row.imported_at,
    factory: {} as Factory // Omitted in list view
  }));
}

export function mapFactoryStructure(backendPayload: any): Configuration {
  const { factory, canvas, version, areas } = backendPayload;

  const mappedFactory: Factory = {
    id: String(factory.factory_id),
    name: factory.factory_name,
    width: canvas.width || 2000,
    height: canvas.length || 1000,
    gridUnit: 50,
    areas: (areas || []).map((area: any) => ({
      id: String(area.area_id),
      areaId: area.external_area_code || String(area.area_id),
      areaName: area.area_name,
      x: area.pos_x || 0,
      y: area.pos_y || 0,
      width: area.width || 400,
      height: area.length || 400,
      lines: (area.lines || []).map((line: any) => ({
        id: String(line.line_id),
        lineId: line.external_line_code || String(line.line_id),
        lineName: line.line_name,
        x: area.pos_x || 0, // Inherit area position for absolute calculations if needed, though UI might use relative
        y: area.pos_y || 0,
        width: area.width || 400,
        height: 100,
        workCenters: (line.workstations || []).map((ws: any) => ({
          id: String(ws.ws_id),
          workCenterId: ws.ws_code || String(ws.ws_id),
          machineName: ws.ws_name,
          x: ws.pos_x || 0,
          y: ws.pos_y || 0,
          width: ws.width || 80,
          height: ws.length || 80,
          status: 'operational', // Default mock status
          detail: ws.detail || '',
          flows: (ws.flows || []).map((flow: any) => ({
            id: String(flow.from_ws_id) + '-' + String(flow.to_ws_id),
            fromWsId: String(flow.from_ws_id),
            toWsId: String(flow.to_ws_id),
            arrowType: flow.transport_type,
            label: String(flow.distance || '')
          }))
        }))
      })),
      buffers: [],
      storage: []
    }))
  };

  // The UI needs a flat array of flows on the Factory object
  const allFlows: any[] = [];
  mappedFactory.areas.forEach(a => {
    a.lines.forEach(l => {
      l.workCenters.forEach(w => {
        if ((w as any).flows) {
          allFlows.push(...(w as any).flows);
        }
      });
    });
  });
  mappedFactory.flows = allFlows;

  return {
    id: String(version.layout_version_id),
    version: version.version_name,
    name: version.layout_name,
    isActive: version.is_current_version === 1,
    status: version.status,
    adminComments: version.admin_comments,
    reviewedBy: version.reviewed_by,
    reviewedAt: version.reviewed_at,
    createdAt: version.imported_at,
    updatedAt: version.imported_at,
    factory: mappedFactory
  };
}

export interface Ticket {
  id: string;
  user_id: string;
  event_id: string;
  precio: number;
  archivo: string;
  creado_en: Date;
  // Campos calculados/joined
  vendedor?: string;
  evento?: string;
  date?: Date;
  location?: string;
}

export interface Event {
  id: string;
  name: string;
  date: Date;
  location: string;
  description?: string;
  created_at?: Date;
}

export interface CreateTicketDto {
  event_id: string;
  precio: number;
}

export interface TicketWithEvent extends Ticket {
  event: Event;
}

export interface Purchase {
  id: string;
  ticket_id: string;
  comprador_id: string;
  vendedor_id?: string;
  precio: number;
  archivo: string;
  event_id: string;
  fecha: Date;
  // Campos joined
  evento?: string;
  comprador?: string;
}
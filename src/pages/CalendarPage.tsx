import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
} from "lucide-react";
import { getCalendarAppointments } from "../lib/api";
import type { CalendarAppointment } from "../types/recruitment";

export function CalendarPage() {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    getCalendarAppointments()
      .then(setAppointments)
      .catch(() => setError(true))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const monthName = currentDate.toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();

  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  const startingDay = firstDay === 0 ? 6 : firstDay - 1;

  const days = Array.from(
    { length: startingDay + daysInMonth },
    (_, index) => {
      if (index < startingDay) return null;
      return index - startingDay + 1;
    },
  );

  const appointmentsByDay = useMemo(() => {
    const grouped: Record<number, CalendarAppointment[]> = {};

    appointments.forEach((appointment) => {
      const date = new Date(appointment.startAt);

      if (
        date.getFullYear() === currentDate.getFullYear() &&
        date.getMonth() === currentDate.getMonth()
      ) {
        const day = date.getDate();

        if (!grouped[day]) {
          grouped[day] = [];
        }

        grouped[day].push(appointment);
      }
    });

    return grouped;
  }, [appointments, currentDate]);

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const today = new Date();

  return (
    <div className="calendar-page">
      {/* Başlık */}
      <div className="calendar-page-header">
        <div className="calendar-page-title">
          <div className="calendar-page-icon">
            <CalendarDays size={20} />
          </div>

          <div>
            <h1>Takvim</h1>
            <p>Aday mülakat ve randevu takvimi</p>
          </div>
        </div>

        {/* Ay değiştirme */}
        <div className="calendar-month-navigation">
          <button
            type="button"
            onClick={previousMonth}
            aria-label="Önceki ay"
            className="calendar-month-button"
          >
            <ChevronLeft size={17} />
          </button>

          <div className="calendar-month-name">{monthName}</div>

          <button
            type="button"
            onClick={nextMonth}
            aria-label="Sonraki ay"
            className="calendar-month-button"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* Takvim */}
      <div className="calendar-container">
        {/* Gün isimleri */}
        <div className="calendar-week-header">
          {[
            "Pazartesi",
            "Salı",
            "Çarşamba",
            "Perşembe",
            "Cuma",
            "Cumartesi",
            "Pazar",
          ].map((day) => (
            <div key={day} className="calendar-week-day">
              {day}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="calendar-loading">
            <div className="calendar-loading-spinner" />
            <span>Takvim yükleniyor...</span>
          </div>
        ) : error ? (
          <p className="data-message" role="alert">Takvim verileri alınamadı. Backend bağlantısını kontrol edin.</p>
        ) : (
          <div className="calendar-grid">
            {days.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="calendar-empty-day"
                  />
                );
              }

              const dayAppointments = appointmentsByDay[day] || [];

              const bookedAppointments = dayAppointments.filter(
                (appointment) => appointment.isBooked,
              );

              const isToday =
                today.getDate() === day &&
                today.getMonth() === currentDate.getMonth() &&
                today.getFullYear() === currentDate.getFullYear();

              return (
                <div
                  key={day}
                  className={`calendar-day ${isToday ? "today" : ""}`}
                >
                  {/* Gün numarası */}
                  <div className="calendar-day-header">
                    <div
                      className={`calendar-day-number ${
                        isToday ? "today" : ""
                      }`}
                    >
                      {day}
                    </div>

                    {bookedAppointments.length > 0 && (
                      <span className="calendar-appointment-count">
                        {bookedAppointments.length} randevu
                      </span>
                    )}
                  </div>

                  {/* Randevular */}
                  <div className="calendar-appointments">
                    {bookedAppointments.map((appointment) => {
                      const date = new Date(appointment.startAt);

                      return (
                        <div
                          key={appointment.id}
                          className="calendar-appointment"
                        >
                          {/* Saat */}
                          <div className="calendar-appointment-time">
                            <Clock size={10} />

                            <span>
                              {date.toLocaleTimeString("tr-TR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {/* Aday */}
                          <div className="calendar-appointment-content">
                            <div className="calendar-appointment-avatar">
                              <User size={10} />
                            </div>

                            <div className="calendar-appointment-info">
                              <div className="calendar-appointment-name">
                                {appointment.candidateName || "Aday"}
                              </div>

                              {appointment.positionTitle && (
                                <div className="calendar-appointment-position">
                                  {appointment.positionTitle}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

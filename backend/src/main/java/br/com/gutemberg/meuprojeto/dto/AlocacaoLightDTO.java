package br.com.gutemberg.meuprojeto.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO leve para o endpoint GET /api/alocacoes?mes=&ano=
 * Substitui o uso de escalaService.listar() (que carregava 80-200KB) com
 * um payload mínimo contendo apenas o necessário para exibir
 * "quem está escalado em quais eventos" na tela de Disponibilidade.
 */
public class AlocacaoLightDTO {

    private Long eventoId;
    private String eventoNome;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate eventoData;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime eventoHoraInicio;

    private Long colaboradorId;
    private String colaboradorNome;

    public AlocacaoLightDTO() {}

    public AlocacaoLightDTO(Long eventoId, String eventoNome, LocalDate eventoData,
                             LocalTime eventoHoraInicio, Long colaboradorId, String colaboradorNome) {
        this.eventoId = eventoId;
        this.eventoNome = eventoNome;
        this.eventoData = eventoData;
        this.eventoHoraInicio = eventoHoraInicio;
        this.colaboradorId = colaboradorId;
        this.colaboradorNome = colaboradorNome;
    }

    public Long getEventoId() { return eventoId; }
    public void setEventoId(Long eventoId) { this.eventoId = eventoId; }

    public String getEventoNome() { return eventoNome; }
    public void setEventoNome(String eventoNome) { this.eventoNome = eventoNome; }

    public LocalDate getEventoData() { return eventoData; }
    public void setEventoData(LocalDate eventoData) { this.eventoData = eventoData; }

    public LocalTime getEventoHoraInicio() { return eventoHoraInicio; }
    public void setEventoHoraInicio(LocalTime eventoHoraInicio) { this.eventoHoraInicio = eventoHoraInicio; }

    public Long getColaboradorId() { return colaboradorId; }
    public void setColaboradorId(Long colaboradorId) { this.colaboradorId = colaboradorId; }

    public String getColaboradorNome() { return colaboradorNome; }
    public void setColaboradorNome(String colaboradorNome) { this.colaboradorNome = colaboradorNome; }
}

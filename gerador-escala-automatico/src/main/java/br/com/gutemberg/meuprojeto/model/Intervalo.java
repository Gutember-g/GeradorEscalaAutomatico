package br.com.gutemberg.meuprojeto.model;

import java.time.LocalDate;
import java.util.List;

public class Intervalo {
	private LocalDate dataInicio;
	private LocalDate dataFim;
	List<LocalDate> Dias;
	
	
	public Intervalo(LocalDate dataInicio, LocalDate dataFim) {
		
	}
	
	
	boolean contem(LocalDate data) {
		boolean contem = data.isAfter(dataInicio) && data.isBefore(dataFim) || data.isEqual(data);
		return true;
	}
}

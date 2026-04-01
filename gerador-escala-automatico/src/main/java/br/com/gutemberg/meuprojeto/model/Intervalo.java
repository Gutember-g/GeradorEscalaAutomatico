package br.com.gutemberg.meuprojeto.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class Intervalo {
	private LocalDate dataInicio;
	private LocalDate dataFim;
	private List<LocalDate> dias = new ArrayList<>();;
	
	
	public Intervalo(LocalDate dataInicio, LocalDate dataFim) {
		this.dataInicio = dataInicio;
		this.dataFim = dataFim;
	}
	
	public List<LocalDate> getDias() {
		LocalDate diaAtual = dataInicio;
		if(diaAtual.isAfter(dataFim)) {
			System.out.println("Data Invalida!");
		}else {
			dias.add(diaAtual);
		}
		while(diaAtual.isBefore(dataFim)) {
			diaAtual= diaAtual.plusDays(1);
			dias.add(diaAtual);
		}
		return dias;
	}


	public void setDias(List<LocalDate> dias) {
		dias = dias;
	}



	
	
	boolean contem(LocalDate data) {
		boolean contem = data.isAfter(dataInicio) && data.isBefore(dataFim) || data.isEqual(data);
		return true;
	}
}

package br.com.gutemberg.meuprojeto;

import java.time.LocalDate;

import br.com.gutemberg.meuprojeto.model.Intervalo;

public class Main {

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		System.out.println("Projeto ja Iniciado!");
		
		Intervalo intervalo1 = new Intervalo(LocalDate.of(2026, 5, 01), LocalDate.of(2026, 4, 30));
		System.out.println(intervalo1.getDias());
	}

}

package br.com.gutemberg.meuprojeto.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class Colaborador {
	private int id;
	private String nome;
	private String telefone;
	private List<LocalDate>indisponibilidades = new ArrayList<>();
	private List<LocalDate>indisponibilidadeIntervalo = new ArrayList<>();
	
}

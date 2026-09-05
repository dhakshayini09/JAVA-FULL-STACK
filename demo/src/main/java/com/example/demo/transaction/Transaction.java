package com.example.demo.transaction;
import jakarta.persistence.*; import java.time.LocalDate;
@Entity @Table(name="transactions") public class Transaction {
@Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; @Column(nullable=false) String type,category,description; @Column(nullable=false) double amount; @Column(nullable=false) LocalDate date;
public Transaction(){} public Transaction(String t,String c,String d,double a,LocalDate dt){type=t;category=c;description=d;amount=a;date=dt;}
public Long getId(){return id;} public String getType(){return type;} public void setType(String v){type=v;} public String getCategory(){return category;} public void setCategory(String v){category=v;} public String getDescription(){return description;} public void setDescription(String v){description=v;} public double getAmount(){return amount;} public void setAmount(double v){amount=v;} public LocalDate getDate(){return date;} public void setDate(LocalDate v){date=v;}}

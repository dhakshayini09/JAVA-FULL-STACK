package com.example.demo.transaction;
import org.springframework.http.ResponseEntity; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/transactions") @CrossOrigin public class TransactionController{
private final TransactionRepository repo; public TransactionController(TransactionRepository r){repo=r;}
@GetMapping public List<Transaction> all(){return repo.findAll().stream().sorted(Comparator.comparing(Transaction::getDate).reversed()).toList();}
@PostMapping public Transaction add(@RequestBody Transaction t){return repo.save(t);}
@PutMapping("/{id}") public ResponseEntity<Transaction> update(@PathVariable Long id,@RequestBody Transaction t){return repo.findById(id).map(x->{x.setType(t.getType());x.setCategory(t.getCategory());x.setDescription(t.getDescription());x.setAmount(t.getAmount());x.setDate(t.getDate());return ResponseEntity.ok(repo.save(x));}).orElse(ResponseEntity.notFound().build());}
@DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){if(!repo.existsById(id))return ResponseEntity.notFound().build();repo.deleteById(id);return ResponseEntity.noContent().build();}}

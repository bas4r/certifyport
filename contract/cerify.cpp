#include <eosio/eosio.hpp>
#include <string>
#include <vector>
using namespace std;
using namespace eosio;

CONTRACT cerify : public eosio::contract
{
public:
	struct signer
	{
		name name;
		bool issigned;
	};

private:
	TABLE certificate
	{
		uint64_t id;
		string certtemplate;
		vector<uint64_t> assignees;
		vector<signer> signers;

		uint64_t primary_key() const { return id; }
	};
	typedef eosio::multi_index<"certificate"_n, certificate> certificate_table;

	TABLE corporate
	{
		uint64_t id;
		string name;

		uint64_t primary_key() const { return id; }
	};
	typedef eosio::multi_index<"corporate"_n, corporate> corporate_table;

	template <typename T>
	void cleanTable()
	{
		T db(_self, _self.value);
		while (db.begin() != db.end())
		{
			auto itr = --db.end();
			db.erase(itr);
		}
	}
	template <typename T>
	void cleanTableScope(uint64_t scope)
	{
		T db(_self, scope);
		while (db.begin() != db.end())
		{
			auto itr = --db.end();
			db.erase(itr);
		}
	}

public:
	using contract::contract;
	cerify(name self, name code, datastream<const char *> ds) : contract(self, code, ds) {}

	ACTION cleancorp()
	{
		require_auth(_self);
		cleanTable<corporate_table>();
	}

	ACTION cleancert(uint64_t scope)
	{
		require_auth(_self);
		cleanTableScope<certificate_table>(scope);
	}

	ACTION createcorp(uint64_t id, string name)
	{
		require_auth(_self);
		corporate_table _corporate(_self, _self.value);

		auto itr = _corporate.find(id);
		check(itr == _corporate.end(), "Company had been added before.");

		_corporate.emplace(_self, [&](auto &c) {
			c.id = id;
			c.name = name;
		});
	}

	ACTION createcert(uint64_t id, uint64_t corporateid, string certtemplate, vector<uint64_t> assignees)
	{
		require_auth(_self);
		certificate_table _certificate(_self, corporateid);
		corporate_table _corporate(_self, _self.value);

		auto corp_itr = _corporate.find(corporateid);
		check(corp_itr != _corporate.end(), "Corporate couldn't found.");

		auto itr = _certificate.find(id);
		check(itr == _certificate.end(), "Certificate had been added before.");

		_certificate.emplace(_self, [&](auto &c) {
			c.id = id;
			c.certtemplate = certtemplate;
			c.assignees = assignees;
		});
	}

	ACTION deletecert(uint64_t id, uint64_t corporateid)
	{
		require_auth(_self);
		certificate_table _certificate(_self, corporateid);
		corporate_table _corporate(_self, _self.value);

		auto corp_itr = _corporate.find(corporateid);
		check(corp_itr != _corporate.end(), "Corporate couldn't found.");

		auto itr = _certificate.find(id);
		check(itr != _certificate.end(), "No certificate found.");

		_certificate.erase(itr);
	}

	ACTION addsigner(uint64_t id, uint64_t corporateid, vector<signer> signers)
	{
		require_auth(_self);
		certificate_table _certificate(_self, corporateid);

		auto itr = _certificate.find(id);
		check(itr != _certificate.end(), "Certificate does not exist.");
		vector<signer> newsign = itr->signers;
		newsign.insert(newsign.end(), signers.begin(), signers.end());

		_certificate.modify(itr, _self, [&](auto &c) {
			c.signers = newsign;
		});
	}

	ACTION signcert(uint64_t id, uint64_t corporateid, name signerr)
	{
		require_auth(signerr);
		certificate_table _certificate(_self, corporateid);

		auto itr = _certificate.find(id);
		check(itr != _certificate.end(), "Certificate does not exist.");
		vector<signer> signersArr = itr->signers;
		for (int i = 0; i < signersArr.size(); i++)
		{
			if (signersArr[i].name == signerr)
			{
				signersArr[i].issigned = 1;
				_certificate.modify(itr, _self, [&](auto &c) {
					c.signers = signersArr;
				});
				break;
			}
		}
	}
};
EOSIO_DISPATCH(cerify, (createcorp)(createcert)(deletecert)(addsigner)(signcert)(cleancert)(cleancorp))